import { useEffect, useRef, useState, useCallback } from 'react';
import useProfile from '@/hooks/useProfile';
import { Message, ConnectedUser } from '../../types/chatTypes';
import { getToken } from '@/utils/storage';
import { CHAT_BASE_URL, WS_BASE_URL, API_BASE_URL } from '../../configs/chats/chatConfig';
import { Buffer } from 'buffer';
import { createFileMessage } from '@/utils/chats/messageHandlers';

// Constants
const MAX_MESSAGES = 100;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_TIMEOUT = 5000;
const PING_INTERVAL = 60000;
const RECONNECT_DELAY = 3000;

interface WebSocketWithHeartbeat extends WebSocket {
  heartbeatInterval?: ReturnType<typeof setInterval>;
}

export interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  sendTyping: () => void;
  sendReadReceipt: (messageId: string) => void;
  sendReaction: (messageId: string, reaction: string) => void;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  typing: { id: string; name?: string }[];
  connect: (roomId: string) => Promise<void>;
  disconnect: () => void;
  ws: WebSocketWithHeartbeat | null;
  addMessage: (message: Message) => void;
}

interface ConnectionState {
  isConnecting: boolean;
  hasAttemptedConnection: boolean;
  reconnectAttempts: number;
}

interface WebSocketState {
  ws: WebSocketWithHeartbeat | null;
  isConnected: boolean;
  error: string | null;
  messages: Message[];
  connectedUsers: ConnectedUser[];
  typing: { id: string; name?: string }[];
}

export const useWebSocket = (roomId: string): WebSocketHook => {
  const { user } = useProfile();
  const userId = user?.data[0]?._id;
  
  // Use a single state object to reduce useState calls
  const [state, setState] = useState<WebSocketState>({
    ws: null,
    isConnected: false,
    error: null,
    messages: [],
    connectedUsers: [],
    typing: []
  });

  // Use refs for connection state management
  const connectionState = useRef<ConnectionState>({
    isConnecting: false,
    hasAttemptedConnection: false,
    reconnectAttempts: 0
  });
  
  const sentMessageIds = useRef<Set<string>>(new Set());
  const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to update connection state
  const updateConnectionState = useCallback((updates: Partial<ConnectionState>) => {
    connectionState.current = { ...connectionState.current, ...updates };
  }, []);

  // Create message object with proper structure
  const createMessage = useCallback((data: any, isHistory = false): Message => {
    // Guard สำหรับ null data
    if (!data) {
      console.warn('createMessage called with null data');
      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user: { _id: '', name: { first: '', middle: '', last: '' }, username: '' },
        type: 'message',
        timestamp: new Date().toISOString(),
        isRead: false,
        isTemp: false,
        text: '',
        username: ''
      };
    }



    // เพิ่ม logic: ถ้ามี _id แต่ไม่มี id ให้ map _id เป็น id
    const id = data.id || data._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const baseMessage = {
      id,
      user: safeUser(data.user),
      timestamp: data.timestamp || new Date().toISOString(),
      isRead: false,
      isTemp: false
    };

    if (data.file_url) {
      const fileUrl = data.file_url.startsWith('http') 
        ? data.file_url 
        : `${API_BASE_URL}/uploads/${data.file_url}`;
      
      return {
        ...baseMessage,
        fileUrl,
        fileName: data.file_name,
        fileType: data.file_type,
        type: 'file' as const,
        username: data.username || data.senderName || data.user_id || data.userId || ''
      };
    }

    if (data.stickerId || (data.image && !data.message)) {
      return {
        ...baseMessage,
        image: data.image,
        stickerId: data.stickerId,
        type: 'sticker' as const,
        username: data.username || data.senderName || data.user_id || data.userId || ''
      };
    }

    // Handle text messages with potential replyTo
    let messageContent = data.message;
    let replyTo = undefined;
    if (data.replyTo) {
      // รองรับทั้งแบบใหม่ (replyTo.message) และแบบเก่า
      replyTo = {
        id: String(
          data.replyTo.id ||
          (data.replyTo.message && (data.replyTo.message._id || data.replyTo.message.id)) ||
          data.reply_to_id ||
          ''
        ),
        text: String(
          data.replyTo.text ||
          (data.replyTo.message && (data.replyTo.message.message || data.replyTo.message.text)) ||
          ''
        ),
        user: data.replyTo.user ? safeUser(data.replyTo.user) : undefined,
      };
    } else if (data.reply_to_id) {
      replyTo = {
        id: String(data.reply_to_id),
        text: '',
        user: undefined,
      };
    }

    return {
      ...baseMessage,
      text: messageContent,
      type: 'message' as const,
      replyTo,
      username: data.username || data.senderName || data.user_id || data.userId || ''
    };
  }, []);

  // Add message with memory management and deduplication
  const addMessage = useCallback((message: Message | null) => {
    // Guard สำหรับ null message (return เงียบ ๆ)
    if (!message || !message.id) {
      return;
    }

    setState(prev => {
      const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // ถ้าเป็นข้อความจริง (isTemp = false) ให้ลบ temp message ที่ตรงกันออกก่อน
      let filteredMessages = prev.messages;
      if (!message.isTemp && message.text) {
        if (!message.user || !message.user._id) {
          return { ...prev, messages: filteredMessages };
        }
        const userId = message.user._id;
        filteredMessages = prev.messages.filter(
          m =>
            !(
              m.isTemp &&
              m.text === message.text &&
              (
                (m.user && m.user._id && m.user._id === userId) ||
                (!m.user || !m.user._id)
              )
            )
        );
      }

      // ตรวจสอบซ้ำว่ามี messageId นี้อยู่แล้วหรือไม่
      if (filteredMessages.some(msg => msg.id === messageId) || sentMessageIds.current.has(messageId)) {
        return { ...prev, messages: filteredMessages };
      }

      const newMessage = { ...message, id: messageId };
      sentMessageIds.current.add(messageId);

      const newMessages = [...filteredMessages, newMessage];
      return {
        ...prev,
        messages: newMessages.slice(-MAX_MESSAGES)
      };
    });
  }, []);

  // Handle user join/leave
  const handleUserJoin = useCallback((userId: string, username?: string) => {
    if (!userId) return;
    
    
    setState(prev => {
      if (prev.connectedUsers.find(u => u.id === userId)) {
        return prev;
      }
      const newUsers = [...prev.connectedUsers, { id: userId, name: username, online: true }];
      return {
        ...prev,
        connectedUsers: newUsers.slice(-50)
      };
    });
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    if (!userId) return;
    
    
    setState(prev => ({
      ...prev,
      connectedUsers: prev.connectedUsers.filter(u => u.id !== userId)
    }));
  }, []);

  // Reconnect logic
  const attemptReconnect = useCallback(() => {
    if (connectionState.current.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, connectionState.current.reconnectAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectionState.current.reconnectAttempts += 1;
      
      if (state.ws) {
        try {
          state.ws.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      connect(roomId);
    }, delay);
  }, [roomId, state.ws]);

  // WebSocket connection function
  const connect = useCallback(async (roomId: string) => {
    if (!roomId || !userId) {
      return;
    }

    if (connectionState.current.isConnecting) {
      return;
    }

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      updateConnectionState({ isConnecting: true });
      
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Check token expiration
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        throw new Error('Token expired');
      }

      const wsUrl = `${WS_BASE_URL}/chat/ws/${roomId}?token=${token}`;
      
      // Close existing connection if any
      if (state.ws) {
        try {
          state.ws.close();
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
        updateState({ ws: null });
      }
      
      const socket = new WebSocket(wsUrl) as WebSocketWithHeartbeat;
      
      // Set connection timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          updateConnectionState({ isConnecting: false });
          updateState({ error: 'Connection timeout' });
        }
      }, CONNECTION_TIMEOUT);
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // กรณี backend ส่ง type: 'message' (ไม่มี eventType) - รวมทั้ง history messages
          if (data.type === 'message' && data.payload && data.payload.message) {
            const msg = data.payload.message;
            const newMessage = createMessage({
              ...msg,
              user: data.payload.user,
              user_id: data.payload.user?._id,
              username: data.payload.user?.username,
            }, true);
            if (newMessage) {
              addMessage(newMessage);
            }
            return;
          }

          // เดิม: eventType: 'history'
          if (data.eventType === 'history') {
            const messageData = data.payload;
            if (Array.isArray(messageData)) {
              messageData.forEach((msg, index) => {
                try {
                  // Guard สำหรับ null msg
                  if (!msg) {
                    return;
                  }
                  // เช็คว่า msg เป็นไฟล์หรือไม่
                  if (
                    msg.type === 'upload' && msg.file && msg.user && msg.message
                  ) {
                    // กรณี upload จาก history (backend ส่งแบบใหม่)
                    const fileData = {
                      file: msg.file,
                      message: msg.message,
                      user: msg.user,
                      timestamp: msg.timestamp || (msg.message && msg.message.timestamp) || new Date().toISOString(),
                    };
                    const userObj = (typeof fileData === 'object' && fileData !== null && 'user' in (fileData as any) && (fileData as any).user) ? safeUser((fileData as any).user) : {
                      _id: 'user_id' in fileData ? fileData.user_id : (fileData as any).user && (fileData as any).user._id || '',
                      name: { first: '', middle: '', last: '' },
                      username: ((fileData as any).user && (fileData as any).user.username) || ('username' in fileData ? fileData.username : ''),
                    };
                    const fileMsg = createFileMessage(fileData, userObj);
                    if (fileMsg && fileMsg.user && fileMsg.user._id) {
                      addMessage(fileMsg);
                    }
                  } else if (
                    msg.type === 'upload' ||
                    msg.type === 'file' ||
                    msg.file_url ||
                    msg.image ||
                    (msg.file && (msg.file.path || typeof msg.file === 'string')) ||
                    msg.filename
                  ) {
                    // legacy/other file message
                    const fileData = {
                      _id: msg._id,
                      file_url: msg.file_url || msg.image || (msg.file && (msg.file.path || msg.file)) || msg.filename || '',
                      file_name: msg.file_name || msg.filename || '',
                      file_type: msg.file_type || '',
                      user_id: msg.user_id || (msg.user && msg.user._id) || '',
                      timestamp: msg.timestamp || new Date().toISOString(),
                      user: msg.user,
                    };
                    
                    if (fileData.file_url && !fileData.file_url.startsWith('http')) {
                      fileData.file_url = `${API_BASE_URL}/uploads/${fileData.file_url}`;
                    }
                    const userObj = (typeof fileData === 'object' && fileData !== null && 'user' in (fileData as any) && (fileData as any).user) ? safeUser((fileData as any).user) : {
                      _id: 'user_id' in fileData ? fileData.user_id : (fileData as any).user && (fileData as any).user._id || '',
                      name: { first: '', middle: '', last: '' },
                      username: ((fileData as any).user && (fileData as any).user.username) || ('username' in fileData ? fileData.username : ''),
                    };
                    const fileMsg = createFileMessage(fileData, userObj);
                    if (fileMsg && fileMsg.user && fileMsg.user._id) {
                      addMessage(fileMsg);
                    }
                  } else if (msg.reply_to_id || msg.replyToId || msg.replyTo) {
                    // ข้อความ reply
                    let replyTo = msg.replyTo;
                    
                    // ถ้าไม่มี replyTo แต่มี reply_to_id หรือ replyToId ใน message
                    if (!replyTo && (msg.reply_to_id || msg.replyToId)) {
                      const replyToId = msg.reply_to_id || msg.replyToId;
                      
                      // หา original message จาก message list ที่มีอยู่แล้ว
                      const originalMessage = state.messages.find(m => m.id === replyToId);
                      if (originalMessage) {
                        replyTo = {
                          message: {
                            _id: originalMessage.id,
                            message: originalMessage.text,
                            timestamp: originalMessage.timestamp
                          },
                          user: originalMessage.user
                        };
                      } else {
                        // ถ้าไม่เจอ original message ให้สร้าง fallback replyTo
                        replyTo = {
                          message: {
                            _id: replyToId,
                            message: '[ข้อความต้นฉบับไม่พบ]',
                            timestamp: msg.timestamp
                          },
                          user: undefined
                        };
                      }
                    }
                    
                    // สร้าง reply message
                    const replyMessage = createMessage({
                      ...msg,
                      replyTo: replyTo ? {
                        id: replyTo.message?._id || replyTo.message?.id || '',
                        text: replyTo.message?.message || replyTo.message?.text || '',
                        user: replyTo.user || undefined, // เพิ่ม fallback สำหรับกรณีที่ไม่มี user
                        timestamp: replyTo.message?.timestamp
                      } : undefined
                    }, true);
                    
                    if (replyMessage) {
                      addMessage(replyMessage);
                    }
                  } else {
                    // ข้อความปกติ
                    const newMessage = createMessage(msg, true);
                    if (newMessage) addMessage(newMessage);
                  }
                } catch (parseError) {
                  console.error('Error parsing history message:', parseError);
                }
              });
            } else if (messageData && messageData.id) {
              try {
                // Guard สำหรับ null messageData
                if (!messageData) {
                  return;
                }
                // เช็คว่า messageData เป็นไฟล์หรือไม่
                if (
                  messageData.type === 'upload' ||
                  messageData.type === 'file' ||
                  messageData.file_url ||
                  messageData.image ||
                  (messageData.file && (messageData.file.path || typeof messageData.file === 'string')) ||
                  messageData.filename
                ) {
                  const fileData = {
                    _id: messageData._id,
                    file_url: messageData.file_url || messageData.image || (messageData.file && (messageData.file.path || messageData.file)) || messageData.filename || '',
                    file_name: messageData.file_name || messageData.filename || '',
                    file_type: messageData.file_type || '',
                    user_id: messageData.user_id || (messageData.user && messageData.user._id) || '',
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    user: messageData.user,
                  };
                  
                  if (fileData.file_url && !fileData.file_url.startsWith('http')) {
                    fileData.file_url = `${API_BASE_URL}/uploads/${fileData.file_url}`;
                  }
                  const userObj = (typeof fileData === 'object' && fileData !== null && 'user' in (fileData as any) && (fileData as any).user) ? safeUser((fileData as any).user) : {
                    _id: 'user_id' in fileData ? fileData.user_id : (fileData as any).user && (fileData as any).user._id || '',
                    name: { first: '', middle: '', last: '' },
                    username: ((fileData as any).user && (fileData as any).user.username) || ('username' in fileData ? fileData.username : ''),
                  };
                  const fileMsg = createFileMessage(fileData, userObj);
                  if (fileMsg && fileMsg.user && fileMsg.user._id) {
                    addMessage(fileMsg);
                  }
                } else if (messageData.reply_to_id || messageData.replyToId || messageData.replyTo) {
                  // ข้อความ reply (single message)
                  let replyTo = messageData.replyTo;
                  
                  // ถ้าไม่มี replyTo แต่มี reply_to_id หรือ replyToId ใน message
                  if (!replyTo && (messageData.reply_to_id || messageData.replyToId)) {
                    const replyToId = messageData.reply_to_id || messageData.replyToId;
                    
                    // หา original message จาก message list ที่มีอยู่แล้ว
                    const originalMessage = state.messages.find(m => m.id === replyToId);
                    if (originalMessage) {
                      replyTo = {
                        message: {
                          _id: originalMessage.id,
                          message: originalMessage.text,
                          timestamp: originalMessage.timestamp
                        },
                        user: originalMessage.user
                      };
                    } else {
                      // ถ้าไม่เจอ original message ให้สร้าง fallback replyTo
                      replyTo = {
                        message: {
                          _id: replyToId,
                          message: '[ข้อความต้นฉบับไม่พบ]',
                          timestamp: messageData.timestamp
                        },
                        user: undefined
                      };
                    }
                  }
                  
                  // สร้าง reply message
                  const replyMessage = createMessage({
                    ...messageData,
                    replyTo: replyTo ? {
                      id: replyTo.message?._id || replyTo.message?.id || '',
                      text: replyTo.message?.message || replyTo.message?.text || '',
                      user: replyTo.user || undefined, // เพิ่ม fallback สำหรับกรณีที่ไม่มี user
                      timestamp: replyTo.message?.timestamp
                    } : undefined
                  }, true);
                  
                  if (replyMessage) {
                    addMessage(replyMessage);
                  }
                } else {
                  const newMessage = createMessage(messageData, true);
                  if (newMessage) addMessage(newMessage);
                }
              } catch (parseError) {
                console.error('Error parsing history message:', parseError);
              }
            }
          } else if (data.eventType === 'message') {
            try {
              const messageData = data.payload;
              if (!messageData) {
                return;
              }
              const isOwnMessage = messageData.user?._id === userId;
              if (!isOwnMessage) {
                const newMessage = createMessage(messageData);
                if (newMessage) addMessage(newMessage);
              }
            } catch (parseError) {
              console.error('Error parsing message:', parseError);
            }
          }

          // เพิ่มรองรับ type: 'upload'
          if (data.type === 'upload' && data.payload) {
            const payload = data.payload;
            const uploadData = {
              _id: payload.message?._id || '',
              file_url: `${API_BASE_URL}/uploads/${payload.filename || payload.file || ''}`,
              file_name: payload.filename || payload.file || '',
              file_type: 'image',
              user_id: payload.user?._id || '',
              timestamp: payload.timestamp || new Date().toISOString(),
              user: payload.user,
            }
            const userObj = (typeof uploadData === 'object' && uploadData !== null && 'user' in (uploadData as any) && (uploadData as any).user) ? safeUser((uploadData as any).user) : {
              _id: 'user_id' in uploadData ? uploadData.user_id : (uploadData as any).user && (uploadData as any).user._id || '',
              name: { first: '', middle: '', last: '' },
              username: ((uploadData as any).user && (uploadData as any).user.username) || ('username' in uploadData ? uploadData.username : ''),
            };
            const uploadMsg = createFileMessage(uploadData, userObj);
            if (uploadMsg && uploadMsg.user && uploadMsg.user._id) {
              addMessage(uploadMsg);
            }
            return;
          }

          // เพิ่มรองรับ type: 'reply'
          if (data.type === 'reply' && data.payload) {
            const payload = data.payload;
            
            const msg = payload.message;
            let replyTo = payload.replyTo;
            
            // ถ้าไม่มี replyTo แต่มี reply_to_id หรือ replyToId ใน message
            if (!replyTo && (msg.reply_to_id || msg.replyToId)) {
              const replyToId = msg.reply_to_id || msg.replyToId;
              
              // หา original message จาก message list ที่มีอยู่แล้ว
              const originalMessage = state.messages.find(m => m.id === replyToId);
              if (originalMessage) {
                replyTo = {
                  message: {
                    _id: originalMessage.id,
                    message: originalMessage.text,
                    timestamp: originalMessage.timestamp
                  },
                  user: originalMessage.user
                };
              } else {
                // ถ้าไม่เจอ original message ให้สร้าง fallback replyTo
                replyTo = {
                  message: {
                    _id: replyToId,
                    message: '[ข้อความต้นฉบับไม่พบ]',
                    timestamp: msg.timestamp
                  },
                  user: undefined
                };
              }
            }
            
            // ถ้าไม่มี replyTo ใน payload แต่มีใน message object
            if (!replyTo && payload.replyTo) {
              replyTo = payload.replyTo;
            }
            
            // สร้าง reply message
            const replyMessage = createMessage({
              ...msg,
              user: payload.user,
              user_id: payload.user?._id,
              username: payload.user?.username,
              replyTo: replyTo ? {
                id: replyTo.message?._id || replyTo.message?.id || '',
                text: replyTo.message?.message || replyTo.message?.text || '',
                user: replyTo.user || undefined, // เพิ่ม fallback สำหรับกรณีที่ไม่มี user
                timestamp: replyTo.message?.timestamp
              } : undefined
            }, true);
            
            if (replyMessage) {
              addMessage(replyMessage);
            }
          }

          // เพิ่มรองรับ type: 'sticker'
          if (data.type === 'sticker' && data.payload) {
            const payload = data.payload;
            
            // Guard สำหรับ sticker ที่ไม่มีข้อมูลครบ
            if (!payload.sticker?.image || !payload.user?._id) {
              console.warn('Invalid sticker message - missing image or user ID:', payload);
              return;
            }
            
            // สร้าง sticker message แยกจาก file message
            const stickerMsg: Message = {
              id: payload.message?._id || `sticker-${Date.now()}`,
              user: safeUser(payload.user),
              type: 'sticker',
              timestamp: payload.timestamp || new Date().toISOString(),
              isRead: false,
              isTemp: false,
              stickerId: payload.sticker?._id || '',
              image: `${API_BASE_URL}/uploads/${payload.sticker?.image || ''}`,
            };
            addMessage(stickerMsg);
            return;
          }

          // เพิ่มรองรับ type: 'evoucher'
          if (data.type === 'evoucher' && data.payload) {
            const payload = data.payload;
            const evoucherInfo = payload.evoucherInfo || {};
            const msg = payload.message || {};
            const userObj = safeUser(payload.user);
            const evoucherMessage = {
              id: msg._id || msg.id || `evoucher-${Date.now()}`,
              user: userObj,
              type: 'evoucher',
              timestamp: payload.timestamp || msg.timestamp || new Date().toISOString(),
              isRead: false,
              isTemp: false,
              text: msg.message || '',
              evoucherInfo: {
                claimUrl: evoucherInfo.claimUrl || '',
                description: evoucherInfo.description || '',
                title: evoucherInfo.title || '',
              },
            };
            addMessage(evoucherMessage);
            return;
          }
        } catch (err) {
          console.error('Error handling message:', err, event.data);
        }
      };
      socket.onopen = () => {
        updateState({
          isConnected: true,
          error: null,
          ws: socket
        });
        updateConnectionState({
          isConnecting: false,
          reconnectAttempts: 0,
          hasAttemptedConnection: false
        });
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
        // Setup heartbeat
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.ping();
            } catch (err) {
              console.error('Error sending ping:', err);
              clearInterval(pingInterval);
              socket.close();
            }
          } else {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL);
        socket.heartbeatInterval = pingInterval;
      };
      socket.onclose = (event) => {
        updateState({ isConnected: false, ws: null });
        updateConnectionState({ isConnecting: false });
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
        if (socket.heartbeatInterval) {
          clearInterval(socket.heartbeatInterval);
        }
        if (event.code !== 1000 && event.code !== 1001) {
          attemptReconnect();
        }
      };

      updateState({ ws: socket });
    } catch (error) {
      updateState({ error: 'Failed to create WebSocket connection' });
      updateConnectionState({ isConnecting: false });
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      setTimeout(() => {
        attemptReconnect();
      }, RECONNECT_DELAY);
    }
  }, [roomId, userId, addMessage, attemptReconnect, createMessage, updateState, updateConnectionState]);

  // Initialize connection
  useEffect(() => {
    if (roomId && userId && !connectionState.current.isConnecting && !state.ws && !state.isConnected && !connectionState.current.hasAttemptedConnection) {
      updateConnectionState({ hasAttemptedConnection: true });
      connect(roomId);
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = null;
      }
      
      if (state.ws) {
        const socket = state.ws;
        
        if (socket.heartbeatInterval) {
          clearInterval(socket.heartbeatInterval);
        }

        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          try {
            socket.close(1000, "Component unmounted");
          } catch (e) {
            console.error('Error closing WebSocket:', e);
          }
        }
      }
      
      updateState({
        connectedUsers: [],
        isConnected: false,
        error: null
      });
      updateConnectionState({
        isConnecting: false,
        hasAttemptedConnection: false
      });
    };
  }, [roomId, userId]);

  // Clear messages when room or user changes
  useEffect(() => {
    updateState({
      messages: [],
      connectedUsers: [],
      typing: []
    });
    sentMessageIds.current.clear();
  }, [roomId, userId]);

  // Message sending functions
  const sendMessage = useCallback((message: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      updateState({ error: 'Not connected to chat server' });
      return;
    }

    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sentMessageIds.current.add(messageId);
      state.ws.send(message);
    } catch (error) {
      console.error('Error sending message:', error);
      updateState({ error: 'Failed to send message' });
    }
  }, [state.ws, updateState]);

  const sendTyping = useCallback(() => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const typingData = {
      eventType: 'typing',
      payload: { typing: true }
    };
    
    state.ws.send(JSON.stringify(typingData));
  }, [state.ws]);

  const sendReadReceipt = useCallback((messageId: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const readData = {
      eventType: 'read_receipt',
      payload: { messageId }
    };
    
    state.ws.send(JSON.stringify(readData));
  }, [state.ws]);

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    
    const reactionData = {
      eventType: 'message_reaction',
      payload: { messageId, reaction }
    };
    
    state.ws.send(JSON.stringify(reactionData));
  }, [state.ws]);

  const disconnect = useCallback(() => {
    if (state.ws) {
      state.ws.close();
      updateState({ ws: null });
    }
    updateConnectionState({ hasAttemptedConnection: false });
  }, [state.ws, updateState, updateConnectionState]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendReaction,
    messages: state.messages,
    connectedUsers: state.connectedUsers,
    typing: state.typing,
    connect,
    disconnect,
    ws: state.ws,
    addMessage
  };
};

export default useWebSocket;

function safeUser(userObj: any) {
  if (!userObj) return { _id: '', name: { first: '', middle: '', last: '' }, username: '' };
  return {
    _id: userObj._id || userObj.user_id || '',
    name: {
      first: userObj.name?.first || '',
      middle: userObj.name?.middle || '',
      last: userObj.name?.last || '',
    },
    username: userObj.username || '',
  };
} 
import { Message } from '../../types/chatTypes';
import { createMessage, safeUser } from './messageUtils';
import { createFileMessage } from '@/utils/chats/messageHandlers';
import { CHAT_BASE_URL } from '../../configs/chats/chatConfig';
import { Platform } from 'react-native';

// args: { state, updateState, updateConnectionState, addMessage, ... }

// ตัวอย่าง stub
export function onMessage(event: MessageEvent, args: any) {
  const { state, addMessage, userId } = args;
  try {
    const data = JSON.parse(event.data);
    // Filter: ignore ping message
    if (data.type === 'ping') {
      return;
    }
    // กรณี backend ส่ง type: 'message' (ไม่มี eventType) - รวมทั้ง history messages
    if (data.type === 'message' && data.payload && data.payload.message) {
      const msg = data.payload.message;
      const newMessage = createMessage(
        {
          ...msg,
          user: data.payload.user,
          user_id: data.payload.user?._id,
          username: data.payload.user?.username,
        },
        true,
      );
      if (newMessage) addMessage(newMessage);
      return;
    }
    // เดิม: eventType: 'history'
    if (data.eventType === 'history') {
      const messageData = data.payload;
      if (Array.isArray(messageData)) {
        messageData.forEach(msg => {
          if (!msg) return;
          if (msg.type === 'upload' && msg.file && msg.user && msg.message) {
            const fileData = {
              file: msg.file,
              message: msg.message,
              user: msg.user,
              timestamp:
                msg.timestamp ||
                (msg.message && msg.message.timestamp) ||
                new Date().toISOString(),
            };
            const userObj =
              fileData && fileData.user
                ? safeUser(fileData.user)
                : {
                    _id: '',
                    name: { first: '', middle: '', last: '' },
                    username: '',
                  };
            const fileMsg = createFileMessage(fileData, userObj);
            if (fileMsg && fileMsg.user && fileMsg.user._id)
              addMessage(fileMsg);
          } else if (
            msg.type === 'upload' ||
            msg.type === 'file' ||
            msg.file_url ||
            msg.image ||
            (msg.file && (msg.file.path || typeof msg.file === 'string')) ||
            msg.filename
          ) {
            const fileData = {
              _id: msg._id,
              file_url:
                msg.file_url ||
                msg.image ||
                (msg.file && (msg.file.path || msg.file)) ||
                msg.filename ||
                '',
              file_name: msg.file_name || msg.filename || '',
              file_type: msg.file_type || '',
              user_id: msg.user_id || (msg.user && msg.user._id) || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              user: msg.user,
            };
            if (fileData.file_url && !fileData.file_url.startsWith('http')) {
              fileData.file_url = `${CHAT_BASE_URL}/uploads/${fileData.file_url}`;
            }
            const userObj =
              fileData && fileData.user
                ? safeUser(fileData.user)
                : {
                    _id: '',
                    name: { first: '', middle: '', last: '' },
                    username: '',
                  };
            const fileMsg = createFileMessage(fileData, userObj);
            if (fileMsg && fileMsg.user && fileMsg.user._id)
              addMessage(fileMsg);
          } else if (msg.reply_to_id || msg.replyToId || msg.replyTo) {
            let replyTo = msg.replyTo;
            if (!replyTo && (msg.reply_to_id || msg.replyToId)) {
              const replyToId = msg.reply_to_id || msg.replyToId;
              const originalMessage = state.messages.find(
                (m: Message) => m.id === replyToId,
              );
              if (originalMessage) {
                replyTo = {
                  message: {
                    _id: originalMessage.id,
                    message: originalMessage.text,
                    timestamp: originalMessage.timestamp,
                  },
                  user: originalMessage.user,
                };
              } else {
                replyTo = {
                  message: {
                    _id: replyToId,
                    message: '[ข้อความต้นฉบับไม่พบ]',
                    timestamp: msg.timestamp,
                  },
                  user: undefined,
                };
              }
            }
            const replyMessage = createMessage(
              {
                ...msg,
                replyTo: replyTo
                  ? {
                      id: replyTo.message?._id || replyTo.message?.id || '',
                      text:
                        replyTo.message?.message || replyTo.message?.text || '',
                      user: replyTo.user || undefined,
                      timestamp: replyTo.message?.timestamp,
                    }
                  : undefined,
              },
              true,
            );
            if (replyMessage) addMessage(replyMessage);
          } else {
            const newMessage = createMessage(msg, true);
            if (newMessage) addMessage(newMessage);
          }
        });
      } else if (messageData && messageData.id) {
        // single message
        if (
          messageData.type === 'upload' ||
          messageData.type === 'file' ||
          messageData.file_url ||
          messageData.image ||
          (messageData.file &&
            (messageData.file.path || typeof messageData.file === 'string')) ||
          messageData.filename
        ) {
          const fileData = {
            _id: messageData._id,
            file_url:
              messageData.file_url ||
              messageData.image ||
              (messageData.file &&
                (messageData.file.path || messageData.file)) ||
              messageData.filename ||
              '',
            file_name: messageData.file_name || messageData.filename || '',
            file_type: messageData.file_type || '',
            user_id:
              messageData.user_id ||
              (messageData.user && messageData.user._id) ||
              '',
            timestamp: messageData.timestamp || new Date().toISOString(),
            user: messageData.user,
          };
          if (fileData.file_url && !fileData.file_url.startsWith('http')) {
            fileData.file_url = `${CHAT_BASE_URL}/uploads/${fileData.file_url}`;
          }
          const userObj =
            fileData && fileData.user
              ? safeUser(fileData.user)
              : {
                  _id: '',
                  name: { first: '', middle: '', last: '' },
                  username: '',
                };
          const fileMsg = createFileMessage(fileData, userObj);
          if (fileMsg && fileMsg.user && fileMsg.user._id) addMessage(fileMsg);
        } else if (
          messageData.reply_to_id ||
          messageData.replyToId ||
          messageData.replyTo
        ) {
          let replyTo = messageData.replyTo;
          if (!replyTo && (messageData.reply_to_id || messageData.replyToId)) {
            const replyToId = messageData.reply_to_id || messageData.replyToId;
            const originalMessage = state.messages.find(
              (m: Message) => m.id === replyToId,
            );
            if (originalMessage) {
              replyTo = {
                message: {
                  _id: originalMessage.id,
                  message: originalMessage.text,
                  timestamp: originalMessage.timestamp,
                },
                user: originalMessage.user,
              };
            } else {
              replyTo = {
                message: {
                  _id: replyToId,
                  message: '[ข้อความต้นฉบับไม่พบ]',
                  timestamp: messageData.timestamp,
                },
                user: undefined,
              };
            }
          }
          const replyMessage = createMessage(
            {
              ...messageData,
              replyTo: replyTo
                ? {
                    id: replyTo.message?._id || replyTo.message?.id || '',
                    text:
                      replyTo.message?.message || replyTo.message?.text || '',
                    user: replyTo.user || undefined,
                    timestamp: replyTo.message?.timestamp,
                  }
                : undefined,
            },
            true,
          );
          if (replyMessage) addMessage(replyMessage);
        } else {
          const newMessage = createMessage(messageData, true);
          if (newMessage) addMessage(newMessage);
        }
      }
      return;
    }
    if (data.eventType === 'message') {
      try {
        const messageData = data.payload;
        if (!messageData) return;
        // PATCH: handle evoucherInfo in payload
        if (messageData.evoucherInfo && messageData.message) {
          const merged = {
            ...messageData.message,
            evoucherInfo: messageData.evoucherInfo,
            user: messageData.user,
            timestamp: messageData.timestamp,
          };
          const newMessage = createMessage(merged);
          if (newMessage) addMessage(newMessage);
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
      return;
    }
    // type: 'upload'
    if (data.type === 'upload' && data.payload) {
      const payload = data.payload;
      const uploadData = {
        _id: payload.message?._id || '',
        file_url: `${CHAT_BASE_URL}/uploads/${
          payload.filename || payload.file || ''
        }`,
        file_name: payload.filename || payload.file || '',
        file_type: 'image',
        user_id: payload.user?._id || '',
        timestamp: payload.timestamp || new Date().toISOString(),
        user: payload.user,
      };
      const userObj =
        uploadData && uploadData.user
          ? safeUser(uploadData.user)
          : {
              _id: '',
              name: { first: '', middle: '', last: '' },
              username: '',
            };
      const uploadMsg = createFileMessage(uploadData, userObj);
      if (uploadMsg && uploadMsg.user && uploadMsg.user._id)
        addMessage(uploadMsg);
      return;
    }
    // type: 'reply'
    if (data.type === 'reply' && data.payload) {
      const payload = data.payload;
      const msg = payload.message;
      let replyTo = payload.replyTo;
      if (!replyTo && (msg.reply_to_id || msg.replyToId)) {
        const replyToId = msg.reply_to_id || msg.replyToId;
        const originalMessage = state.messages.find(
          (m: Message) => m.id === replyToId,
        );
        if (originalMessage) {
          replyTo = {
            message: {
              _id: originalMessage.id,
              message: originalMessage.text,
              timestamp: originalMessage.timestamp,
            },
            user: originalMessage.user,
          };
        } else {
          replyTo = {
            message: {
              _id: replyToId,
              message: '[ข้อความต้นฉบับไม่พบ]',
              timestamp: msg.timestamp,
            },
            user: undefined,
          };
        }
      }
      if (!replyTo && payload.replyTo) replyTo = payload.replyTo;
      const replyMessage = createMessage(
        {
          ...msg,
          user: payload.user,
          user_id: payload.user?._id,
          username: payload.user?.username,
          replyTo: replyTo
            ? {
                id: replyTo.message?._id || replyTo.message?.id || '',
                text: replyTo.message?.message || replyTo.message?.text || '',
                user: replyTo.user || undefined,
                timestamp: replyTo.message?.timestamp,
              }
            : undefined,
        },
        true,
      );
      if (replyMessage) addMessage(replyMessage);
      return;
    }
    // type: 'sticker'
    if (data.type === 'sticker' && data.payload) {
      const payload = data.payload;
      if (!payload.sticker?.image || !payload.user?._id) return;
      const stickerMsg: Message = {
        id: payload.message?._id || `sticker-${Date.now()}`,
        user: safeUser(payload.user),
        type: 'sticker',
        timestamp: payload.timestamp || new Date().toISOString(),
        isRead: false,
        isTemp: false,
        stickerId: payload.sticker?._id || '',
        image: `${CHAT_BASE_URL}/uploads/${payload.sticker?.image || ''}`,
      };
      addMessage(stickerMsg);
      return;
    }
    // type: 'evoucher'
    if (data.type === 'evoucher' && data.payload && data.payload.evoucherInfo) {
      // Merge payload.message, evoucherInfo, user, timestamp
      const merged = {
        ...data.payload.message,
        evoucherInfo: data.payload.evoucherInfo,
        user: data.payload.user,
        timestamp: data.payload.timestamp,
      };
      const newMessage = createMessage(merged);
      if (newMessage) addMessage(newMessage);
      return;
    }
  } catch (err) {
    console.error('Error handling message:', err, event.data);
  }
}

export function onOpen(event: Event, args: any) {
  const {
    ws,
    updateState,
    updateConnectionState,
    connectionTimeout,
    PING_INTERVAL,
  } = args;
  updateState({ isConnected: true, error: null, ws });
  updateConnectionState({
    isConnecting: false,
    reconnectAttempts: 0,
    hasAttemptedConnection: false,
  });
  if (connectionTimeout.current) {
    clearTimeout(connectionTimeout.current);
  }
  // Setup heartbeat
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping && ws.ping();
      } catch (err) {
        clearInterval(pingInterval);
        ws.close();
      }
    } else {
      clearInterval(pingInterval);
    }
  }, PING_INTERVAL);
  ws.heartbeatInterval = pingInterval;
}

export function onClose(event: CloseEvent, args: any) {
  const {
    updateState,
    updateConnectionState,
    connectionTimeout,
    ws,
    attemptReconnect,
  } = args;
  updateState({ isConnected: false, ws: null });
  updateConnectionState({ isConnecting: false });
  if (connectionTimeout.current) {
    clearTimeout(connectionTimeout.current);
  }
  if (ws && ws.heartbeatInterval) {
    clearInterval(ws.heartbeatInterval);
  }
  if (event.code !== 1000 && event.code !== 1001) {
    attemptReconnect && attemptReconnect();
  }
}

export function attemptReconnect(args: any) {
  const {
    connectionState,
    reconnectTimeoutRef,
    state,
    connect,
    roomId,
    MAX_RECONNECT_ATTEMPTS,
  } = args;
  if (connectionState.current.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
  const delay = Math.min(
    1000 * Math.pow(2, connectionState.current.reconnectAttempts),
    30000,
  );
  reconnectTimeoutRef.current = setTimeout(() => {
    connectionState.current.reconnectAttempts += 1;
    if (state.ws) {
      try {
        state.ws.close();
      } catch (e) {}
    }
    connect(roomId);
  }, delay);
}

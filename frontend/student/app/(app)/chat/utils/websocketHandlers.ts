import { Message } from '../types/chatTypes';

export const handleWebSocketMessage = (event: WebSocket.MessageEvent, addMessage: (message: Message) => void) => {
  try {
    const data = JSON.parse(event.data.toString());
    console.log('WebSocket message received:', data);

    if (data.eventType === 'history') {
      const chatData = data.payload.chat;
      console.log('Parsed history message:', chatData);

      // Skip file name messages
      if (chatData.message?.startsWith('[file]')) {
        console.log('Skipping file name message:', chatData.message);
        return;
      }

      // Skip empty messages
      if (!chatData.message && !chatData.file_url && !chatData.stickerId) {
        console.log('Skipping empty message:', chatData);
        return;
      }

      // Create message object based on type
      let message: Message;
      
      if (chatData.file_url) {
        message = {
          id: chatData.id,
          fileUrl: chatData.file_url,
          fileName: chatData.file_name,
          fileType: chatData.file_type,
          senderId: chatData.user_id,
          senderName: chatData.user_id,
          type: 'file',
          timestamp: chatData.timestamp,
          isRead: false,
        };
      
        console.log('Created file message from history:', message);
      } else if (chatData.stickerId) {
        message = {
          id: chatData.id,
          image: chatData.image,
          stickerId: chatData.stickerId,
          senderId: chatData.user_id,
          senderName: chatData.user_id,
          type: 'sticker',
          timestamp: chatData.timestamp,
          isRead: false,
        };
      } else if (chatData.message) {
        message = {
          id: chatData.id,
          text: chatData.message,
          senderId: chatData.user_id,
          senderName: chatData.user_id,
          type: 'message',
          timestamp: chatData.timestamp,
          isRead: false,
        };
      } else {
        console.log('Skipping message with no content:', chatData);
        return;
      }

      console.log('Adding history message:', message);
      addMessage(message);
    } else if (data.eventType === 'message') {
      const messageData = data.payload;
      console.log('Received new message:', messageData);

      // Skip file name messages since we already have the file message
      if (messageData.message?.startsWith('[file]')) {
        console.log('Skipping file name message:', messageData.message);
        return;
      }

      const message: Message = {
        id: Date.now().toString(),
        text: messageData.message,
        senderId: messageData.userId,
        senderName: messageData.userId,
        type: 'message',
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      addMessage(message);
    } else if (data.eventType === 'sticker') {
      const stickerData = data.payload;
      const message: Message = {
        id: Date.now().toString(),
        image: stickerData.sticker,
        stickerId: stickerData.stickerId,
        senderId: stickerData.userId,
        senderName: stickerData.userId,
        type: 'sticker',
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      addMessage(message);
    } else if (data.eventType === 'file') {
      const fileData = data.payload;
      console.log('Received file message:', fileData);
      
      const message: Message = {
        id: Date.now().toString(),
        fileUrl: fileData.fileURL,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        senderId: fileData.userId,
        senderName: fileData.userId,
        type: 'file',
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      console.log('Created file message:', message);
      addMessage(message);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}; 
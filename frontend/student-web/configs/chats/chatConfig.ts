// Base URL for HTTP requests
export const CHAT_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:1334';
// Base URL for WebSocket connections
export const WS_BASE_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:1334';

export const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// API endpoint base URL
export const API_BASE_URL = `${CHAT_BASE_URL}/api`;

// WebSocket endpoint - Updated to match required format
export const getWebSocketUrl = (roomId: string, token: string) => 
  `${WS_BASE_URL}/chat/ws/${roomId}/?token=${token}`;

export default {
  CHAT_BASE_URL,
  WS_BASE_URL,
  API_BASE_URL,
  IMAGE_BASE_URL,
  getWebSocketUrl
};   
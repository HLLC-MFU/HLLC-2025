import { Platform } from 'react-native';

// Base URL for HTTP requests
export const CHAT_BASE_URL = Platform.OS === 'android' 
  ? 'http://172.25.23.205:1334' 
  : 'http://172.25.23.205:1334';

// Base URL for WebSocket connections
export const WS_BASE_URL = Platform.OS === 'android'
  ? 'ws://10.0.2.2:1334'
  : 'ws://172.25.23.205:1334';

// API endpoint base URL
export const API_BASE_URL = `${CHAT_BASE_URL}/api`;

// WebSocket endpoint
export const getWebSocketUrl = (roomId: string, userId: string) => 
  `${WS_BASE_URL}/ws/${roomId}/${userId}`; 
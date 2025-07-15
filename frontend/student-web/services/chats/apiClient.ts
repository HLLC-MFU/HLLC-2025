import { getToken } from '@/utils/storage';
import { API_BASE_URL, CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { Buffer } from 'buffer';

function getTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

export class ApiClient {
  private static async getAuthHeaders() {
    let token = await getToken('accessToken');
    if (!token) token = getTokenFromCookie();
    if (!token) throw new Error('No access token found');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getUserId(): Promise<string> {
    let token = await getToken('accessToken');
    if (!token) token = getTokenFromCookie();
    if (!token) throw new Error('No access token found');

    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const userData = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    return userData.sub;
  }

  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include', // สำคัญสำหรับ cookie
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  static async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    let token = await getToken('accessToken');
    if (!token) token = getTokenFromCookie();
    if (!token) throw new Error('No access token found');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        // ไม่ต้องแนบ Authorization header
        'Content-Type': 'multipart/form-data', // Let browser set this
      },
      body: formData,
      credentials: 'include', // แนบ cookie เสมอ
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload data');
    }

    return response.json();
  }

  static async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    let token = await getToken('accessToken');
    if (!token) token = getTokenFromCookie();
    if (!token) throw new Error('No access token found');

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        // ไม่ต้องแนบ Authorization header
        // 'Content-Type': 'multipart/form-data', // Let browser set this
      },
      body: formData,
      credentials: 'include', // แนบ cookie เสมอ
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update data');
    }

    return response.json();
  }

  // Room-specific endpoints
  static getRoomsEndpoint(): string {
    return `${API_BASE_URL}/rooms`;
  }

  static getRoomEndpoint(roomId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}`;
  }

  static getRoomMembersEndpoint(roomId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}/members`;
  }

  static getRoomJoinEndpoint(roomId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}/join`;
  }

  static getRoomLeaveEndpoint(roomId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}/leave`;
  }

  static getRoomMessagesEndpoint(roomId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}/messages`;
  }

  static getMessageReadEndpoint(roomId: string, messageId: string): string {
    return `${API_BASE_URL}/rooms/${roomId}/messages/${messageId}/read`;
  }

  // Chat-specific endpoints
  static getChatRoomsEndpoint(): string {
    return `${CHAT_BASE_URL}/rooms`;
  }

  static getChatRoomEndpoint(roomId: string): string {
    return `${CHAT_BASE_URL}/api/rooms/${roomId}`;
  }

  static getRoomsWithMembersEndpoint(): string {
    return `${CHAT_BASE_URL}/api/rooms/with-members`;
  }

  // User-specific endpoints
  static getMyRoomsEndpoint(): string {
    return `${API_BASE_URL}/rooms/me`;
  }

  static getAllRoomsForUserEndpoint(): string {
    return `${API_BASE_URL}/rooms/all-for-user`;
  }
} 
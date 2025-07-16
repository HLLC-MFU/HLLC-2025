import { API_BASE_URL, CHAT_BASE_URL } from '@/configs/chats/chatConfig';

export class ApiClient {
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Only use credentials: 'include', no Authorization header
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
      },
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
      headers: { 'Content-Type': 'application/json' },
    });
  }

  static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  static async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload data');
    }

    return response.json();
  }

  static async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
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
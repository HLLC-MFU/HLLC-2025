import { getToken } from '@/utils/storage';
import { WS_BASE_URL } from '../../configs/chats/chatConfig';
import { WebSocketConnection } from './types';

export class WebSocketManager {
  private static connections = new Map<string, WebSocket>();
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly RECONNECT_DELAY = 2000; // 2 seconds
  private static readonly CONNECTION_TIMEOUT = 5000; // 5 seconds

  /**
   * Get existing WebSocket connection for a room
   */
  static getConnection(roomId: string): WebSocket | null {
    const connection = this.connections.get(roomId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      return connection;
    }
    return null;
  }

  /**
   * Connect to WebSocket for a specific room
   */
  static async connect(roomId: string): Promise<WebSocket> {
    // Check if we already have a valid connection
    const existingConnection = this.getConnection(roomId);
    if (existingConnection) {
      return existingConnection;
    }

    // Close existing connection if it exists but is not open
    const oldConnection = this.connections.get(roomId);
    if (oldConnection) {
      oldConnection.close();
      this.connections.delete(roomId);
    }

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      try {
        const ws = await this.createConnection(roomId);
        this.connections.set(roomId, ws);
        return ws;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
          await this.wait(this.RECONNECT_DELAY);
        }
      }
    }

    throw lastError || new Error('Failed to connect after maximum attempts');
  }

  /**
   * Create a new WebSocket connection
   */
  private static async createConnection(roomId: string): Promise<WebSocket> {
    const token = await getToken('accessToken');
    if (!token) {
      throw new Error('No access token found');
    }

    const wsUrl = `${WS_BASE_URL}/chat/ws/${roomId}?token=${token}`;

    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        resolve(socket);
      };

      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      };

      socket.onclose = () => {
        this.connections.delete(roomId);
      };

      // Set a timeout for the connection
      setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          reject(new Error('Connection timeout'));
        }
      }, this.CONNECTION_TIMEOUT);
    });
  }

  /**
   * Disconnect WebSocket for a specific room
   */
  static disconnect(roomId: string): void {
    const ws = this.connections.get(roomId);
    if (ws) {
      ws.close();
      this.connections.delete(roomId);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  static disconnectAll(): void {
    this.connections.forEach((ws, roomId) => {
      ws.close();
    });
    this.connections.clear();
  }

  /**
   * Get all active connections
   */
  static getActiveConnections(): Map<string, WebSocket> {
    return new Map(this.connections);
  }

  /**
   * Check if a connection exists for a room
   */
  static hasConnection(roomId: string): boolean {
    const connection = this.connections.get(roomId);
    return connection !== undefined && connection.readyState === WebSocket.OPEN;
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 
import { useEffect, useState, useRef, useCallback } from "react";
import { NotificationItem } from "@/types/notification";
import { useApi } from "@/hooks/useApi";
import useProfile from "../useProfile";
import { getToken } from "@/utils/storage";
import { useNotificationStore } from '@/stores/notificationStore';

// Define proper types for EventSource polyfill
interface EventSourceOptions {
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

interface EventSourceEvent {
  type: string;
  data?: string;
  error?: Error | ProgressEvent<EventTarget>;
}

// Polyfill for EventSource in React Native
class EventSourcePolyfill {
  private url: string;
  private options: EventSourceOptions;
  private readyState: number;
  public onopen: ((event: EventSourceEvent) => void) | null = null;
  public onmessage: ((event: EventSourceEvent) => void) | null = null;
  public onerror: ((event: EventSourceEvent) => void) | null = null;
  private timeoutId: number | null = null;
  private retryTimeout: number = 5000;
  private xhr: XMLHttpRequest | null = null;

  constructor(url: string, options: EventSourceOptions = {}) {
    this.url = url;
    this.options = options;
    this.readyState = 0; // CONNECTING
  }

  close() {
    this.readyState = 2; // CLOSED
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }

  private async connect() {
    if (this.readyState === 2) return; // CLOSED
    try {
      this.readyState = 0; // CONNECTING
      
      // Get auth token
      const token = await getToken('accessToken');
      
      // Create XMLHttpRequest
      this.xhr = new XMLHttpRequest();
      
      this.xhr.open('GET', this.url, true);
      this.xhr.setRequestHeader('Accept', 'text/event-stream');
      this.xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      if (token) {
        this.xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      let buffer = '';
      
      this.xhr.onreadystatechange = () => {
        
        if (this.xhr?.readyState === 2) { // HEADERS_RECEIVED
          
          if (this.xhr.status === 401) {
            this.readyState = 2; // CLOSED
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error('Authentication failed') });
            }
            return;
          }
          
          if (this.xhr.status !== 200) {
            this.readyState = 2; // CLOSED
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error(`HTTP ${this.xhr.status}`) });
            }
            return;
          }
          
          this.readyState = 1; // OPEN
          
          if (this.onopen) {
            this.onopen({ type: 'open' });
          }
        }
        
        if (this.xhr?.readyState === 3) { // LOADING
          const newData = this.xhr.responseText;
          if (newData) {
            buffer += newData;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (this.onmessage) {
                  this.onmessage({ type: 'message', data });
                }
              } else if (line.trim()) {
              }
            }
          }
        }
        
        if (this.xhr?.readyState === 4) { // DONE
          if (this.xhr.status === 200) {
          } else {
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error(`XHR failed: ${this.xhr.status}`) });
            }
          }
        }
      };
      
      this.xhr.onerror = (error) => {
        if (this.onerror) {
          this.onerror({ type: 'error', error });
        }
      };
      
      this.xhr.onabort = () => {
      };
      
      this.xhr.send();
      
    } catch (error) {
      if (this.onerror) {
        this.onerror({ type: 'error', error: error as Error });
      }
      
      // Retry connection only if not closed
      if (this.readyState !== 2) {
        this.timeoutId = setTimeout(() => {
          this.connect();
        }, this.retryTimeout);
      }
    }
  }

  // Start connection
  start() {
    this.connect();
  }
}

// Define types for API response
interface NotificationApiResponse {
  data?: NotificationItem[];
}

interface SSEData {
  type: 'NEW_NOTIFICATION' | 'REFETCH_NOTIFICATIONS';
  notification?: NotificationItem;
}

// Define types for raw notification data from API
interface RawNotificationData {
  _id: string;
  id?: string;
  title: {
    th: string;
    en: string;
  };
  subtitle: {
    th: string;
    en: string;
  };
  body?: {
    th: string;
    en: string;
  };
  detail?: {
    th: string;
    en: string;
  };
  icon: string;
  image: string;
  redirect?: {
    url: string;
    btnMessage: {
      th: string;
      en: string;
    };
  };
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  read?: boolean;
  isRead?: boolean;
  scope?: string;
}

export function useNotification() {
  const { data, loading, error, request } = useApi<NotificationItem[]>();
  const notifications = useNotificationStore((s) => s.notifications);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationStore((s) => s.markAllAsRead);
  const { user } = useProfile();
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10; // เพิ่มจำนวนครั้งให้มากขึ้น
  const hasInitialFetchRef = useRef(false); // เพิ่ม flag เพื่อป้องกัน fetch ซ้ำ
  
  // Helper function to safely get timestamp
  const getTimestamp = (notification: NotificationItem): number => {
    const timestamp = notification.createdAt || notification.timestamp;
    if (timestamp && typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      return isNaN(parsed) ? Date.now() : parsed;
    }
    return Date.now();
  };

  // Function to mark a single notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const token = await getToken('accessToken');
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        return false;
      }
      
      // const responseData = await response.json();
      
      // Update zustand store
      markAsReadStore(notificationId);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Function to mark all unread notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const unreadIds = notifications
        .filter((n: NotificationItem) => !n.isRead)
        .map((n: NotificationItem) => n._id);
      
      if (unreadIds.length === 0) {
        return true;
      }
      
      const token = await getToken('accessToken');
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Mark each notification as read
      for (const id of unreadIds) {
        const response = await fetch(`${baseUrl}/notifications/${id}/read`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!response.ok) {
          return false; // Stop processing if one fails
        }
        
        // const responseData = await response.json();
      }
      
      // Update zustand store
      markAllAsReadStore();
      
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Initial fetch of notifications (only once)
  useEffect(() => {
    if (hasInitialFetchRef.current) {
      return;
    }

    const fetchNotifications = async () => {
      
      hasInitialFetchRef.current = true; // Set flag immediately
      
      try {
        // Get token for direct fetch
        const token = await getToken('accessToken');
        
        // Direct fetch to debug the issue
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const url = `${baseUrl}/notifications/me`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!response.ok) {
          return;
        }
        
        const responseText = await response.text();
        
        let notificationsData: NotificationItem[] | NotificationApiResponse;
        try {
          notificationsData = JSON.parse(responseText);
        } catch (parseError) {
          return;
        }
        
        // Handle both array and object responses
        let notificationsArray: RawNotificationData[];
        if (Array.isArray(notificationsData)) {
          // Direct array response
          notificationsArray = notificationsData as RawNotificationData[];
        } else if (notificationsData && typeof notificationsData === 'object' && 'data' in notificationsData && notificationsData.data) {
          // Object with data field
          notificationsArray = Array.isArray(notificationsData.data) ? notificationsData.data as RawNotificationData[] : [];
        } else {
          return;
        }
        
        if (notificationsArray.length === 0) {
          setNotifications([]);
          return;
        }
        
        
        // Transform API response to match our interface
        const transformedNotifications: NotificationItem[] = notificationsArray.map((notification: RawNotificationData, index: number) => {
          return {
            ...notification,
            id: notification._id || notification.id, // Ensure id field exists
            timestamp: notification.createdAt || notification.timestamp, // Use createdAt as timestamp
            isRead: notification.isRead, 
          };
        });
        
        
        // Sort notifications by timestamp in descending order (newest first)
        const sortedByTimestamp = [...transformedNotifications].sort(
          (a, b) => getTimestamp(b) - getTimestamp(a)
        );

        // Separate unread and read notifications
        const unread = sortedByTimestamp.filter((n) => !n.isRead);
        const read = sortedByTimestamp.filter((n) => n.isRead);

        
        // Combine them, with unread appearing before read
        setNotifications([...unread, ...read]);
        
      } catch (error) {
      }
    };

    fetchNotifications();
  }, []); // Remove request dependency to prevent infinite loop

  // SSE connection for real-time updates ONLY
  useEffect(() => {
    if (!user?.data?.[0]?._id) {
      return;
    }

    const connectSSE = async () => {
      try {
        const token = await getToken('accessToken');
        if (!token) {
          return;
        }

        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const sseUrl = `${baseUrl}/sse`;
        
        // Close existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create new SSE connection
        const eventSource = new EventSourcePolyfill(sseUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
        });

        eventSource.onopen = (event: EventSourceEvent) => {
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        };

        eventSource.onmessage = (event: EventSourceEvent) => {
          try {
            const sseData: SSEData = JSON.parse(event.data || '{}');
            if (
              sseData.type === 'REFETCH_NOTIFICATIONS'
            ) {
              // Always fetch new notifications from backend
              // Reset the flag to allow fresh fetch
              hasInitialFetchRef.current = false;
              const fetchNotifications = async () => {
                try {
                  const token = await getToken('accessToken');
                  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
                  const url = `${baseUrl}/notifications/me`;
                  const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                  });
                  if (response.ok) {
                    const responseText = await response.text();
                    const notificationsData: NotificationItem[] | NotificationApiResponse = JSON.parse(responseText);
                    let notificationsArray: RawNotificationData[];
                    if (Array.isArray(notificationsData)) {
                      notificationsArray = notificationsData as RawNotificationData[];
                    } else if (notificationsData && typeof notificationsData === 'object' && 'data' in notificationsData && notificationsData.data) {
                      notificationsArray = Array.isArray(notificationsData.data) ? notificationsData.data as RawNotificationData[] : [];
                    } else {
                      return;
                    }
                    if (notificationsArray.length > 0) {
                      const transformedNotifications: NotificationItem[] = notificationsArray.map((notification: RawNotificationData) => ({
                        ...notification,
                        id: notification._id || notification.id,
                        timestamp: notification.createdAt || notification.timestamp,
                        isRead: notification.isRead !== undefined ? notification.isRead : notification.read,
                      }));
                      const sortedByTimestamp = [...transformedNotifications].sort(
                        (a, b) => getTimestamp(b) - getTimestamp(a)
                      );
                      const unread = sortedByTimestamp.filter((n) => !n.isRead);
                      const read = sortedByTimestamp.filter((n) => n.isRead);
                      setNotifications([...unread, ...read]);
                    } else {
                      setNotifications([]);
                    }
                  } else {
                  }
                } catch (error) {
                }
              };
              fetchNotifications();
            }
          } catch (error) {
          }
        };

        eventSource.onerror = (event: EventSourceEvent) => {
          // Increment reconnect attempts
          reconnectAttemptsRef.current++;
          
          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            return;
          }
          
          // Exponential backoff for reconnection
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, backoffDelay);
        };

        eventSourceRef.current = eventSource;
        eventSource.start();
        
      } catch (error) {
      }
    };

    connectSSE();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user?.data?.[0]?._id]);

  return {
    notifications,
    loading,
    // error, // Do not return error to suppress error propagation to UI
    markAsRead,
    markAllAsRead,
  };
}
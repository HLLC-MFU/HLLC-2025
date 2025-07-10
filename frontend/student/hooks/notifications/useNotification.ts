import { useEffect, useState, useRef, useCallback } from "react";
import { NotificationItem } from "@/types/notification";
import { useApi } from "@/hooks/useApi";
import useProfile from "../useProfile";
import { getToken } from "@/utils/storage";

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
    console.log('🔧 [SSE] EventSourcePolyfill created for URL:', url);
  }

  close() {
    console.log('🔧 [SSE] Closing connection');
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
      console.log('🔧 [SSE] Attempting to connect to:', this.url);
      
      // Get auth token
      const token = await getToken('accessToken');
      console.log('🔧 [SSE] Token retrieved:', token ? '✅ Present' : '❌ Missing');
      
      // Create XMLHttpRequest
      this.xhr = new XMLHttpRequest();
      
      this.xhr.open('GET', this.url, true);
      this.xhr.setRequestHeader('Accept', 'text/event-stream');
      this.xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      if (token) {
        this.xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log('🔧 [SSE] Authorization header added');
      }
      
      console.log('🔧 [SSE] Request headers set, opening connection...');
      
      let buffer = '';
      
      this.xhr.onreadystatechange = () => {
        console.log('🔧 [SSE] XHR readyState:', this.xhr?.readyState, 'status:', this.xhr?.status);
        
        if (this.xhr?.readyState === 2) { // HEADERS_RECEIVED
          console.log('🔧 [SSE] Headers received, status:', this.xhr.status);
          
          if (this.xhr.status === 401) {
            console.log('❌ [SSE] Authentication failed (401)');
            this.readyState = 2; // CLOSED
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error('Authentication failed') });
            }
            return;
          }
          
          if (this.xhr.status !== 200) {
            console.error('❌ [SSE] HTTP Error:', this.xhr.status, this.xhr.statusText);
            this.readyState = 2; // CLOSED
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error(`HTTP ${this.xhr.status}`) });
            }
            return;
          }
          
          console.log('✅ [SSE] HTTP response successful, setting readyState to OPEN');
          this.readyState = 1; // OPEN
          console.log('✅ [SSE] Connection established successfully');
          
          if (this.onopen) {
            console.log('🔧 [SSE] Calling onopen callback');
            this.onopen({ type: 'open' });
          }
        }
        
        if (this.xhr?.readyState === 3) { // LOADING
          const newData = this.xhr.responseText;
          if (newData) {
            buffer += newData;
            console.log('🔧 [SSE] Received data, buffer length:', buffer.length);
            console.log('🔧 [SSE] Raw buffer:', buffer);
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                console.log('🔧 [SSE] Found data line:', data);
                if (this.onmessage) {
                  console.log('🔧 [SSE] Calling onmessage callback with data');
                  this.onmessage({ type: 'message', data });
                }
              } else if (line.trim()) {
                console.log('🔧 [SSE] Other line:', line);
              }
            }
          }
        }
        
        if (this.xhr?.readyState === 4) { // DONE
          console.log('🔧 [SSE] XHR connection completed');
          if (this.xhr.status === 200) {
            console.log('✅ [SSE] SSE stream completed successfully');
          } else {
            console.error('❌ [SSE] XHR failed with status:', this.xhr.status);
            if (this.onerror) {
              this.onerror({ type: 'error', error: new Error(`XHR failed: ${this.xhr.status}`) });
            }
          }
        }
      };
      
      this.xhr.onerror = (error) => {
        console.error('❌ [SSE] XHR error:', error);
        if (this.onerror) {
          this.onerror({ type: 'error', error });
        }
      };
      
      this.xhr.onabort = () => {
        console.log('🔧 [SSE] XHR connection aborted');
      };
      
      console.log('🔧 [SSE] Sending XHR request...');
      this.xhr.send();
      
    } catch (error) {
      console.error('❌ [SSE] Connection error:', error);
      if (this.onerror) {
        this.onerror({ type: 'error', error: error as Error });
      }
      
      // Retry connection only if not closed
      if (this.readyState !== 2) {
        console.log('🔧 [SSE] Scheduling retry in', this.retryTimeout, 'ms');
        this.timeoutId = setTimeout(() => {
          this.connect();
        }, this.retryTimeout);
      }
    }
  }

  // Start connection
  start() {
    console.log('🔧 [SSE] Starting connection...');
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user } = useProfile();
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10; // เพิ่มจำนวนครั้งให้มากขึ้น
  const hasInitialFetchRef = useRef(false); // เพิ่ม flag เพื่อป้องกัน fetch ซ้ำ
  
  console.log('🔧 [NOTIFICATION] Hook initialized, user:', user?.data?.[0]?._id ? '✅ Present' : '❌ Missing');
  
  // Helper function to safely get timestamp
  const getTimestamp = (notification: NotificationItem): number => {
    const timestamp = notification.createdAt || notification.timestamp;
    if (timestamp && typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      return isNaN(parsed) ? Date.now() : parsed;
    }
    return Date.now();
  };
  
  // Initial fetch of notifications (only once)
  useEffect(() => {
    if (hasInitialFetchRef.current) {
      console.log('🔧 [NOTIFICATION] Initial fetch already done, skipping');
      return;
    }

    const fetchNotifications = async () => {
      console.log('🔧 [NOTIFICATION] Fetching initial notifications...');
      hasInitialFetchRef.current = true; // Set flag immediately
      
      try {
        // Get token for direct fetch
        const token = await getToken('accessToken');
        console.log('🔧 [NOTIFICATION] Token for direct fetch:', token ? '✅ Present' : '❌ Missing');
        
        // Direct fetch to debug the issue
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const url = `${baseUrl}/notifications/me`;
        console.log('🔧 [NOTIFICATION] Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        console.log('🔧 [NOTIFICATION] Response status:', response.status);
        console.log('🔧 [NOTIFICATION] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [NOTIFICATION] HTTP Error:', response.status, errorText);
          return;
        }
        
        const responseText = await response.text();
        console.log('🔧 [NOTIFICATION] Raw response text:', responseText);
        
        let notificationsData: NotificationItem[] | NotificationApiResponse;
        try {
          notificationsData = JSON.parse(responseText);
          console.log('🔧 [NOTIFICATION] Parsed JSON:', notificationsData);
        } catch (parseError) {
          console.error('❌ [NOTIFICATION] JSON parse error:', parseError);
          return;
        }
        
        // Handle both array and object responses
        let notificationsArray: RawNotificationData[];
        if (Array.isArray(notificationsData)) {
          // Direct array response
          notificationsArray = notificationsData as RawNotificationData[];
          console.log('✅ [NOTIFICATION] Received array response with', notificationsArray.length, 'items');
        } else if (notificationsData && typeof notificationsData === 'object' && 'data' in notificationsData && notificationsData.data) {
          // Object with data field
          notificationsArray = Array.isArray(notificationsData.data) ? notificationsData.data as RawNotificationData[] : [];
          console.log('✅ [NOTIFICATION] Received object response with data field,', notificationsArray.length, 'items');
        } else {
          console.error('❌ [NOTIFICATION] Unexpected response format:', notificationsData);
          return;
        }
        
        if (notificationsArray.length === 0) {
          console.log('🔧 [NOTIFICATION] No notifications found');
          setNotifications([]);
          return;
        }
        
        console.log('✅ [NOTIFICATION] Processing', notificationsArray.length, 'notifications');
        
        // Transform API response to match our interface
        const transformedNotifications: NotificationItem[] = notificationsArray.map((notification: RawNotificationData, index: number) => {
          console.log(`🔧 [NOTIFICATION] Processing notification ${index}:`, notification);
          return {
            ...notification,
            id: notification._id || notification.id, // Ensure id field exists
            timestamp: notification.createdAt || notification.timestamp, // Use createdAt as timestamp
            read: notification.isRead !== undefined ? notification.isRead : notification.read, // Handle both read and isRead
          };
        });
        
        console.log('🔧 [NOTIFICATION] Transformed notifications:', transformedNotifications);
        
        // Sort notifications by timestamp in descending order (newest first)
        const sortedByTimestamp = [...transformedNotifications].sort(
          (a, b) => getTimestamp(b) - getTimestamp(a)
        );

        // Separate unread and read notifications
        const unread = sortedByTimestamp.filter((n) => !n.read);
        const read = sortedByTimestamp.filter((n) => n.read);

        console.log('🔧 [NOTIFICATION] Unread:', unread.length, 'Read:', read.length);

        // Combine them, with unread appearing before read
        setNotifications([...unread, ...read]);
        console.log('✅ [NOTIFICATION] Successfully set notifications');
        
      } catch (error) {
        console.error('❌ [NOTIFICATION] Fetch error:', error);
      }
    };

    fetchNotifications();
  }, []); // Remove request dependency to prevent infinite loop

  // SSE connection for real-time updates ONLY
  useEffect(() => {
    if (!user?.data?.[0]?._id) {
      console.log('🔧 [SSE] Skipping SSE connection - no user available');
      return;
    }

    const connectSSE = async () => {
      try {
        const token = await getToken('accessToken');
        if (!token) {
          console.log('❌ [SSE] No token available, cannot establish SSE connection');
          return;
        }

        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const sseUrl = `${baseUrl}/sse`;
        console.log('🔧 [SSE] Connecting to SSE endpoint:', sseUrl);
        console.log('🕐 [SSE] Connection attempt at:', new Date().toISOString());

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
          console.log('✅ [SSE] Connection opened at:', new Date().toISOString());
          console.log('✅ [SSE] Real-time SSE connection established!');
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        };

        eventSource.onmessage = (event: EventSourceEvent) => {
          console.log('🔧 [SSE] Received SSE message at:', new Date().toISOString());
          console.log('🔧 [SSE] Raw SSE data:', event.data);
          try {
            const sseData: SSEData = JSON.parse(event.data || '{}');
            console.log('✅ [SSE] Parsed SSE data:', sseData);
            
            if (sseData.type === 'NEW_NOTIFICATION' && sseData.notification) {
              // Handle new notification directly
              const notification = sseData.notification;
              console.log('✅ [SSE] Received NEW_NOTIFICATION:', notification);
              
              setNotifications(prev => {
                const newNotification: NotificationItem = {
                  ...notification,
                  id: notification._id || notification.id,
                  timestamp: notification.createdAt || notification.timestamp,
                  read: notification.isRead !== undefined ? notification.isRead : notification.read,
                };
                
                // Check if notification already exists
                const exists = prev.some(n => n.id === newNotification.id);
                if (exists) {
                  console.log('🔧 [SSE] Notification already exists, skipping');
                  return prev;
                }
                
                console.log('✅ [SSE] Adding new notification via SSE at:', new Date().toISOString());
                return [newNotification, ...prev];
              });
            } else if (sseData.type === 'REFETCH_NOTIFICATIONS') {
              // Handle refetch event - trigger a fresh fetch
              console.log('🔄 [SSE] Received REFETCH_NOTIFICATIONS, triggering fresh fetch');
              
              // Reset the flag to allow fresh fetch
              hasInitialFetchRef.current = false;
              
              // Trigger fresh fetch
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
                        read: notification.isRead !== undefined ? notification.isRead : notification.read,
                      }));
                      
                      const sortedByTimestamp = [...transformedNotifications].sort(
                        (a, b) => getTimestamp(b) - getTimestamp(a)
                      );
                      
                      const unread = sortedByTimestamp.filter((n) => !n.read);
                      const read = sortedByTimestamp.filter((n) => n.read);
                      
                      setNotifications([...unread, ...read]);
                      console.log('✅ [SSE] Refetched notifications via SSE');
                    }
                  }
                } catch (error) {
                  console.error('❌ [SSE] Refetch error:', error);
                }
              };
              
              fetchNotifications();
            } else {
              console.log('🔧 [SSE] Unknown SSE event type:', sseData.type);
            }
          } catch (error) {
            console.error('❌ [SSE] Failed to parse SSE data:', error);
          }
        };

        eventSource.onerror = (event: EventSourceEvent) => {
          console.error('❌ [SSE] SSE connection error at:', new Date().toISOString(), event);
          
          // Increment reconnect attempts
          reconnectAttemptsRef.current++;
          
          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log('❌ [SSE] Max SSE reconnect attempts reached, stopping reconnection');
            return;
          }
          
          // Exponential backoff for reconnection
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔧 [SSE] Scheduling SSE reconnect attempt ${reconnectAttemptsRef.current} in ${backoffDelay}ms`);
          
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
        console.error('❌ [SSE] Failed to establish SSE connection:', error);
      }
    };

    connectSSE();

    // Cleanup function
    return () => {
      console.log('🔧 [SSE] Cleaning up SSE connection at:', new Date().toISOString());
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

  console.log('🔧 [NOTIFICATION] Current state:', {
    notificationsCount: notifications.length,
    user: user?.data?.[0]?._id ? 'Present' : 'Missing',
    sseConnection: eventSourceRef.current ? 'Active' : 'Inactive',
  });

  return {
    notifications,
    loading,
    error,
  };
}
import { getToken, saveToken } from '@/utils/storage';
import { getMessaging, AuthorizationStatus } from '@react-native-firebase/messaging';
import { useCallback, useEffect, useState } from 'react';
import useDevice from '@/hooks/useDevice';

const PERMISSION_KEY = 'hasRequestedNotificationPermission';
const TOKEN_KEY = 'fcmToken';

type PermissionStatus = {
  granted: boolean;
  status: number;
};

export default function usePushNotification() {
  const [permission, setPermission] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messaging = getMessaging();
  const { registerDevice } = useDevice()

  const getPermission = useCallback(async () => {
    const status = await messaging.hasPermission();
    setPermission({ granted: status === 1, status });
    return status === 1;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const alreadyRequested = await getToken(PERMISSION_KEY);

      if (!alreadyRequested) {
        const authStatus = await messaging.requestPermission();
        
        const granted =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        setPermission({ granted, status: authStatus });

        if (granted) {
          await saveToken(PERMISSION_KEY, 'true');
        }

        return granted;
      } else {
        return await getPermission();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request notification permission.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getPermission]);

  const registerToken = useCallback(async () => {
    const newToken = await messaging.getToken();
    const oldToken = await getToken(TOKEN_KEY);
    
    if (newToken && newToken !== oldToken) {
      await saveToken(TOKEN_KEY, newToken);
      await registerDevice()
		}
  }, []);

  const listenForegroundNotifications = useCallback(() => {
    return messaging.onMessage(async remoteMessage => {
      // Alert.alert('Notification', JSON.stringify(remoteMessage?.notification) ?? 'New message');
    });
  }, []);

  const initializePushNotification = useCallback(async () => {
    const granted = await requestPermission();    
    if (granted) {
      await registerToken();
    }
    
    return granted;
  }, [requestPermission, registerToken]);

  useEffect(() => {
    const unsubscribe = listenForegroundNotifications();
    return () => unsubscribe();
  }, [listenForegroundNotifications]);

  return {
    permission,
    loading,
    error,
    requestPermission,
    registerToken,
    initializePushNotification,
  };
}
import { getMessaging } from '@react-native-firebase/messaging';

const messaging = getMessaging();

messaging.setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] 📦 Background message received:', remoteMessage);
});
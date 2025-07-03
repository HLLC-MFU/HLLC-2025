// (app)/_layout.tsx

import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SplashScreen, Tabs, usePathname } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import useProfile from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import TabBar from '@/components/global/TabBar';
import BackgroundScreen from '@/components/global/ฺBackgroundScreen';
import { useAppearance } from '@/hooks/useAppearance';
import messaging from '@react-native-firebase/messaging';

function LayoutWrapper() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const assets = useAppearance();

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    requestUserPermission();
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  const isChatRoute = /^\/chat\/[^/]+$/.test(pathname);

  return (
    <View style={{ flex: 1 }}>
      <BackgroundScreen 
        background={assets?.assets?.background ?? null}
        children={<BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />}
      />
      
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          animation: "shift",
          transitionSpec: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 100,
              mass: 3,
              velocity: 0.5,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          }
        }}
        tabBar={() => !isChatRoute ? <TabBar /> : null}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }}/>
        <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
        <Tabs.Screen name="qrcode" options={{ title: 'QR Code' }} />
        <Tabs.Screen name="evoucher/index" options={{ title: 'E-Voucher' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Community' }} />
      </Tabs>
    </View>
  );
}

export default function Layout() {
  return <LayoutWrapper />;
}

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted.');
  }

  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

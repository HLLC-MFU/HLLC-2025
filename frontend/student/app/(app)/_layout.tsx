import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SplashScreen, Tabs, usePathname } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'expo-image';
import useProfile from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import TabBar from '@/components/global/TabBar';
import messaging from '@react-native-firebase/messaging';

export async function requestNotificationPermissionAndGetToken() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  const token = await messaging().getToken();
  console.log('Token:', token);

  return token;
}

export default function Layout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync();
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  // Check if we're in the chat room section
  const isChatRoute = /^\/chat\/[^/]+$/.test(pathname);

  useEffect(() => {
    requestNotificationPermissionAndGetToken().then((token) => {
      if (token) {
        console.log('FCM Token:', token);
        // TODO: ส่ง token ไปเก็บใน backend user profile
      }
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('@/assets/images/lobby.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      </ImageBackground>

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
        tabBar={() => <TabBar />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }}
        />
        <Tabs.Screen name="activities/index" options={{ title: 'Activities' }} />
        <Tabs.Screen name="qrcode" options={{ title: 'QR Code' }} />
        <Tabs.Screen name="evoucher" options={{ title: 'E-Voucher' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Community' }} />

      </Tabs>
    </View>
  );
}

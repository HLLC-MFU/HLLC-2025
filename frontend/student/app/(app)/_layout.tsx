import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SplashScreen, Tabs, usePathname } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'expo-image';
import useProfile from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { BookIcon, GiftIcon, GlobeIcon, HomeIcon, QrCodeIcon } from 'lucide-react-native';
import TabBar from '@/components/global/TabBar';

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
        }}
        tabBar={() => <TabBar /> }
      >
<Tabs.Screen name="(tabs)/index" options={{ title: 'Home' }} />
<Tabs.Screen name="(tabs)/activities/index" options={{ title: 'Activities' }} />
<Tabs.Screen name="(tabs)/qrcode" options={{ title: 'QR Code' }} />
<Tabs.Screen name="(tabs)/evoucher/index" options={{ title: 'E-Voucher' }} />
<Tabs.Screen name="(tabs)/chat/index" options={{ title: 'Community' }} />

      </Tabs>
    </View>
  );
}

import { View, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { SplashScreen, Stack, Tabs, usePathname } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'expo-image';
import useProfile from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/global/BottomNav';

const assetImage = "@/assets/images/"

export default function Layout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync(); // ✅ Hide splash after profile loaded
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
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#64748b',
        }}
        tabBar={props => !isChatRoute ?
          <BottomNav {...props}
            // backgroundImage={require(`${assetImage}IconTest3.png`)}
            // backgroundQR={require(`${assetImage}IconTest4.png`)}
          />
          : null
        }
      />
    </View>
  );
}

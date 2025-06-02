import { View, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { SplashScreen, Stack, Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'expo-image';
import useProfile from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/global/BottomNav';

export default function Layout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync(); // ✅ Hide splash after profile loaded
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: user.theme?.assets?.background }}
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
        tabBar={props => <BottomNav {...props} />}
      />
    </View>
  );
}

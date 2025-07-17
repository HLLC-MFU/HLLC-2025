import { View, StyleSheet, ActivityIndicator, LogBox, Animated, Platform } from 'react-native';
import { router, SplashScreen, Tabs, usePathname } from 'expo-router';
import { Redirect } from 'expo-router';
import { BlurView } from 'expo-blur';
import useProfile from '@/hooks/useProfile';
import { useEffect, useRef, useState } from 'react';
import TabBar from '@/components/global/TabBar';
import BackgroundScreen from '@/components/global/BackgroundScreen';
import usePushNotification from '@/hooks/notifications/usePushNotification';
import useDevice from '@/hooks/useDevice';
import ProgressBar from '@/components/global/ProgressBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassButton } from '@/components/ui/GlassButton';
import NotificationModal from '@/components/global/NotificationModal';
import AssetImage from '@/components/global/AssetImage';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppearance } from '@/hooks/useAppearance';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;
export default function AppLayout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { assets } = useAppearance();
  const { initializePushNotification } = usePushNotification();
  const { registerDevice } = useDevice()
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const assetsImage = {
    background: assets?.background ?? null,
    profile: assets?.profile ?? null,
    notification: assets?.notification ?? null,
    progress: assets?.progress ?? null,
    signOut: assets?.signOut ?? null,
    lamduan: assets?.lamduan ?? null,
  };
  const isIndexPage = pathname === '/' || pathname === '/index';
  const opacity = useRef(new Animated.Value(!isIndexPage ? 1 : 0)).current;

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync();
    });
    initializePushNotification().then((granted) => {
      if (granted) registerDevice();
    });
  }, []);


  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isIndexPage ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [isIndexPage]);


  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  const isChatRoute = /^\/chat\/[^/]+$/.test(pathname);
  LogBox.ignoreLogs([
    'gl.pixelStorei() doesn\'t support this parameter yet',
  ]);

  return (
    <View style={{ flex: 1 }}>
      <BackgroundScreen background={assetsImage?.background ?? null}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </BackgroundScreen>

      <Animated.View style={[StyleSheet.absoluteFill, {opacity: isIndexPage ? 1 : 0}]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.gradient, { top: 0 }]}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.gradient, { bottom: 0 }]}
        />
      </Animated.View>
      <SafeAreaView
        style={{
          display: isChatRoute ? 'none' : 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: Platform.OS === 'ios' ? 8 : 24,
          paddingHorizontal: 16,
        }}
      >
        <ProgressBar
          avatarUrl={assetsImage.profile ?? undefined}
          onClickAvatar={() => router.push('/profile')}
        />
        <GlassButton iconOnly onPress={() => setNotificationModalVisible(true)}>
          {assetsImage.notification ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.notification}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <Bell fill={'white'} color="white" size={20} />
          )}
        </GlassButton>
      </SafeAreaView>
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent', paddingTop: isChatRoute ? 0 : Platform.OS === 'ios' ? 96 : 112, },
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
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="activities/index" options={{ title: 'Activities' }} />
        <Tabs.Screen name="qrcode" options={{ title: 'QR Code' }} />
        <Tabs.Screen name="evoucher/index" options={{ title: 'E-Voucher' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Community' }} />
      </Tabs>
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    height: 120,
    left: 0,
    right: 0,
  },
});
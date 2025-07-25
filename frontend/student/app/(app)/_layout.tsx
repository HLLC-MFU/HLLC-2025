import { View, StyleSheet, ActivityIndicator, LogBox, Animated, Platform, Text } from 'react-native';
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
import { registerBackgroundTaskAsync, syncStepsOnStartup } from '@/hooks/health/useStepCollect';
import PretestModal from '@/components/prepost-modal/PretestModal';
import PosttestModal from '@/components/prepost-modal/PosttestModal';
import usePrePostModal from '@/hooks/usePrePostModal';
import { useProgressStore } from '@/stores/useProgressStore';
import { useProgress } from '@/hooks/useProgress';
import { useNotificationStore } from '@/stores/notificationStore';

export default function AppLayout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { assets } = useAppearance();
  const { initializePushNotification } = usePushNotification();
  const { registerDevice } = useDevice()
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [showPretestModal, setShowPretestModal] = useState(false);
  const [showPosttestModal, setShowPosttestModal] = useState(false);
  const { fetchProgress } = useProgress();
  const progress = useProgressStore((s) => s.progress);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;


  const {
    modalVisible: pretestVisible,
    questions: pretestQuestions,
    loading: pretestLoading,
    error: pretestError,
    submit: submitPretest,
    closeModal: closePretestModal,
  } = usePrePostModal({ type: 'pretest' });

  const {
    modalVisible: posttestVisible,
    questions: posttestQuestions,
    loading: posttestLoading,
    error: posttestError,
    submit: submitPosttest,
  } = usePrePostModal({ type: 'posttest', progress: progress?.progressPercentage });

  useEffect(() => {
    async function setupBackgroundTask() {
      try {
        await registerBackgroundTaskAsync();
        await syncStepsOnStartup();
      } catch (e) {
      }
    }
    setupBackgroundTask();
  }, []);
  useEffect(() => {
    if (pretestVisible && pretestQuestions.length > 0) {
      setShowPretestModal(true);
    }
  }, [pretestVisible, pretestQuestions]);

  useEffect(() => {
    if (posttestVisible && posttestQuestions.length > 0) { 
      setShowPosttestModal(true);
    }
  }, [posttestVisible, posttestQuestions]);

  const isIndexPage = pathname === '/' || pathname === '/index';
  const opacity = useRef(new Animated.Value(!isIndexPage ? 1 : 0)).current;

  useEffect(() => {
    async function startup() {
      try {
        await getProfile();
        await fetchProgress();
      } catch (e) {
        console.error('Startup error:', e);
      } finally {
        setLoading(false);
        SplashScreen.hideAsync();
      }
    }

    startup();

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

  const isCommunityRoute =
    (/^\/community(\/.*)?$/.test(pathname) && pathname !== '/community/chat') ||
    /^\/activities\/[^/]+$/.test(pathname);

  return (
    <View style={{ flex: 1 }}>
      <BackgroundScreen background={user?.data[0].metadata.major.school.acronym.toUpperCase() ?? null}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </BackgroundScreen>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: isIndexPage ? 1 : 0 }]}>
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
          display: isCommunityRoute ? 'none' : 'flex',
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
          avatarUrl={user?.data[0].metadata.major.school.photos?.avatar ?? assets.profile}
          progress={progress?.progressPercentage ?? 0}
          onClickAvatar={() => router.push('/profile')}
        />
        <View style={{ position: 'relative' }}>
          <GlassButton iconOnly onPress={() => setNotificationModalVisible(true)}>
            {assets.notification ? (
              <AssetImage
                uri={`${process.env.EXPO_PUBLIC_API_URL}/uploads/${assets.notification}`}
                style={{ width: 20, height: 20 }}
              />
            ) : (
              <Bell fill={'white'} color="white" size={20} />
            )}
          </GlassButton>
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: 'red',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent', paddingTop: isCommunityRoute ? 0 : Platform.OS === 'ios' ? 96 : 112, },
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
        tabBar={() => (isCommunityRoute ? undefined : <TabBar />)}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="activities/index" options={{ title: 'Activities' }} />
        <Tabs.Screen name="qrcode" options={{ title: 'QR Code' }} />
        <Tabs.Screen name="evoucher/index" options={{ title: 'E-Voucher' }} />
        <Tabs.Screen name="community/chat/index" options={{ title: 'Community' }} />
      </Tabs>
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
      {showPretestModal && (
        <PretestModal
          visible={pretestVisible}
          questions={pretestQuestions}
          loading={pretestLoading}
          error={pretestError}
          onSubmit={submitPretest}
          onClose={closePretestModal}
        />
      )}
      {showPosttestModal && (
        <PosttestModal
          visible={posttestVisible}
          questions={posttestQuestions}
          loading={posttestLoading}
          error={posttestError}
          onSubmit={submitPosttest}
        />
      )}
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
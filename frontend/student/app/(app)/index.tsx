import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router, useRouter } from 'expo-router';

import { Bell, Flower } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from '@/components/global/AssetImage';
import { DoorClosedLocked } from '@tamagui/lucide-icons';
import useHealthData from '@/hooks/health/useHealthData';
import { ProgressSummaryCard } from '@/components/home/ProgressSummaryCard';
import BackgroundScreen from '@/components/global/BackgroundScreen';
import { useEffect, useState } from 'react';
import { registerBackgroundTaskAsync, syncStepsOnStartup } from '@/hooks/health/useStepCollect';
import NotificationModal from '@/components/global/NotificationModal';
import useDevice from '@/hooks/useDevice';
import { useProgress } from '@/hooks/useProgress';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { getStoredDeviceId, revokeDevice } = useDevice();
  const handleSignOut = async () => {
    const deviceId = await getStoredDeviceId()
    await revokeDevice(deviceId)
    useAuth.getState().signOut();
    router.replace('/(auth)/login');
  };
  const { assets } = useAppearance();
  const assetsImage = {
    background: assets?.background ?? null,
    profile: assets?.profile ?? null,
    notification: assets?.notification ?? null,
    progress: assets?.progress ?? null,
    signOut: assets?.signOut ?? null,
    lamduan: assets?.lamduan ?? null,
  };
  const { steps, deviceMismatch } = useHealthData(new Date());
  const { progress, loading: progressLoading } = useProgress();
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



  const content = (
    <SafeAreaView
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <ProgressSummaryCard
        healthData={{ steps, deviceMismatch }}
        progressImage={assetsImage.progress}
        progressPercentage={progress?.progressPercentage ?? 0}
        progressLoading={progressLoading}
        onPress={() => {
          router.push('/profile')
        }}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <GlassButton iconOnly>
          {assetsImage.lamduan ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.lamduan}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <Flower color="white" size={20}
              onPress={() => {
                useRouter().push('/(app)/lamduanflowers');
              }} />
          )}
        </GlassButton>
        {/* <GlassButton iconOnly>
          {assetsImage.profile ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.profile}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <Users color="white" size={20} />
          )}
        </GlassButton> */}
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
      </View>
    </SafeAreaView>
  );

  return (
    <FadeView>
      <BackgroundScreen
        background={assetsImage.background ?? null}
        children={content}
      />
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </FadeView>
  );
}

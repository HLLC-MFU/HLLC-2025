import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Bell } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from '@/components/global/AssetImage';
import { DoorClosedLocked } from '@tamagui/lucide-icons';
import useHealthData from '@/hooks/health/useHealthData';
import { ProgressSummaryCard } from '@/components/home/ProgressSummaryCard';
import BackgroundScreen from '@/components/global/BackgroundScreen';
import { useEffect } from 'react';
import { registerBackgroundTaskAsync, syncStepsOnStartup } from '@/hooks/health/useStepCollect';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const handleSignOut = async () => {
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
  };
  const { steps, deviceMismatch } = useHealthData(new Date());
  useEffect(() => {
    async function setupBackgroundTask() {
      try {
        // Register the background task with a minimum interval
        await registerBackgroundTaskAsync();

        // Optionally sync immediately on startup
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
        onPress={() => {
          router.push('/profile')
        }}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <GlassButton iconOnly>
          {assetsImage.notification ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.notification}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <Bell fill={'white'} color="white" size={20} />
          )}
        </GlassButton>
        <GlassButton onPress={handleSignOut} iconOnly>
          {assetsImage.signOut ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.signOut}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <DoorClosedLocked color="white" size={20} />
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
    </FadeView>
  );
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Alert } from 'react-native';
import { router, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Award, Bell, Flower, Footprints, MapPin, User, Users } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from '@/components/global/AssetImage';
import BackgroundScreen from '@/components/global/ฺBackgroundScreen';
import { DoorClosedLocked } from '@tamagui/lucide-icons';
import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import useHealthData from '@/hooks/health/useHealthData';
import { ProgressSummaryCard } from '@/components/home/ProgressSummaryCard';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const { t } = useTranslation();
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
    lamduan: assets?.lamduan ?? null,
  };

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);
    const [date, setDate] = useState(new Date());
  const { steps } = useHealthData(date);
  const deviceMismatch = false; // or set this based on your logic

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
          console.log('Login pressed!');
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

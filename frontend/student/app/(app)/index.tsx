import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { router, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, User, Users } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { DoorClosedLocked } from '@tamagui/lucide-icons';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from '@/components/global/AssetImage';
import BackgroundScreen from '@/components/global/ฺBackgroundScreen';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const { t } = useTranslation();
  const handleSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace('/(auth)/login'); // ✅ redirect กลับหน้า login (หรือหน้าอื่น)
  };
  const { assets } = useAppearance();
  const assetsImage = {
    background: assets?.background ?? null,
    profile: assets?.profile ?? null,
    notification: assets?.notification ?? null,
    progress: assets?.progress ?? null,
    signOut: assets?.signOut ?? null,
  };

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
      <GlassButton>
        {assetsImage.progress ? (
          <AssetImage
            uri={`${baseImageUrl}/uploads/${assetsImage.progress}`}
            style={{ width: 20, height: 20 }}
          />
        ) : (
          <User
            color="white"
            size={20}
            onPress={() => {
              useRouter().push('/(auth)/login');
            }}
          />
        )}
        <Text
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 20,
            marginLeft: 8,
          }}
        >
          {t('nav.progress')}
        </Text>
      </GlassButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <GlassButton iconOnly>
          {assetsImage.profile ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.profile}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <Users color="white" size={20} />
          )}
        </GlassButton>
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

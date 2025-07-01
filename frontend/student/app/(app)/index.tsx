import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { router, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Award, Bell, Footprints, MapPin, User, Users } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from '@/components/global/AssetImage';
import BackgroundScreen from '@/components/global/ฺBackgroundScreen';
import { Progress, Separator, XStack, YStack } from 'tamagui';

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
            style={{ marginRight: 8 }}
            size={20}
            onPress={() => {
              useRouter().push('/(auth)/login');
            }}
          />
        )}
        <YStack gap={4}>
          {/* Progress */}
          <YStack>
            <Text
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 12,
                marginLeft: 8,
                marginBottom: 2,
              }}
            >
              {t('nav.progress')}
            </Text>
            {/* Progress Bar */}
            <XStack alignItems="center" gap={4}>
              <Progress value={60} size="$1" width={120} height={12} marginLeft={8}>
                <Progress.Indicator />
              </Progress>
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 12,
                marginLeft: 4,
                marginBottom: 2,
              }}>60%</Text>
            </XStack>
          </YStack>
          {/* Separator */}
          <Separator marginLeft={8} />
          <XStack justifyContent='space-evenly'>
            <XStack style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Footprints size={14} color={"white"} />
              <Text
                style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 14,
                  marginLeft: 8,
                }}>
                85
              </Text>
            </XStack>
            <Separator vertical />
            <XStack style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Award size={14} color={"white"} />
              <Text
                style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 14,
                  marginLeft: 8,
                }}>
                85
              </Text>
            </XStack>
          </XStack>
        </YStack>
      </GlassButton>
      <View style={{ flexDirection: 'row', gap: 8 }}>
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
        {/* <GlassButton onPress={handleSignOut} iconOnly>
          {assetsImage.signOut ? (
            <AssetImage
              uri={`${baseImageUrl}/uploads/${assetsImage.signOut}`}
              style={{ width: 20, height: 20 }}
            />
          ) : (
            <DoorClosedLocked color="white" size={20} />
          )}
        </GlassButton> */}
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

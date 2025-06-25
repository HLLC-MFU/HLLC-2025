import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Image,
} from "react-native";
import { ImageBackground } from 'expo-image';
import { router, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Award, Bell, Footprints, User, Users } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import FadeView from '@/components/ui/FadeView';
import useAuth from '@/hooks/useAuth';
import { useInterfaces } from '@/hooks/useInterfaces';
import AssetImage from '@/components/global/AssetImage';
import { Progress, Separator, XStack } from 'tamagui';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const { t } = useTranslation();
  const handleSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace('/(auth)/login');
  };
  const { assets } = useInterfaces();
  const icons = {
    profile: assets?.profile ?? null,
    notification: assets?.notification ?? null,
    progress: assets?.progress ?? null,
  };

  return (
    <FadeView>
      <ImageBackground
        source={require('@/assets/images/lobby.png')}
        contentFit="cover"
        style={{ flex: 1 }}>
        <SafeAreaView style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <GlassButton>
            <View style={{ flexDirection: 'row', alignItems: 'center',paddingHorizontal: 12 }}>
              {icons.progress ? (
                <AssetImage uri={`${baseImageUrl}/uploads/${icons.progress}`} style={{ width: 20, height: 20 }} />
              ) : (
                <User
                  color="white"
                  size={20}
                  onPress={() => {
                    useRouter().push('/(auth)/login');
                  }}
                />
              )}
              <View>
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 14,
                    marginLeft: 8,
                  }}
                >
                  {t('nav.progress')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Progress value={80} size="small" backgroundColor={'#00000050'} style={{ width: 120, height: 12.5, marginLeft: 8 }}>
                    <Progress.Indicator animation="bouncy" backgroundColor={'white'} />
                  </Progress>
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 12,
                    marginLeft: 8,
                  }}>80%</Text>
                </View>
                <XStack style={{
                  marginLeft: 8,
                  marginTop: 4,
                  alignItems: 'center',
                }}>
                  <Footprints color="white" size={16} />
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 12,
                    marginLeft: 4,
                  }}>
                    9,889
                  </Text>
                  <Separator alignSelf="stretch" vertical marginHorizontal={8} />
                  <Award color="white" size={16} />
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 12,
                    marginLeft: 4,
                  }}>
                    9/14
                  </Text>
                </XStack>
              </View>

            </View>

          </GlassButton>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* <GlassButton iconOnly>
              {icons.profile ? (
                <AssetImage uri={`${baseImageUrl}/uploads/${icons.profile}`} style={{ width: 20, height: 20 }}/>
              ) : (
                <Users color="white" size={20} />
              )}
            </GlassButton> */}
            <GlassButton iconOnly>
              {icons.notification ? (
                <AssetImage uri={`${baseImageUrl}/uploads/${icons.notification}`} style={{ width: 20, height: 20 }} />
              ) : (
                <Bell fill={"white"} color="white" size={20} />
              )}
            </GlassButton>
            {/* <GlassButton
              onPress={handleSignOut}
              iconOnly
            >
              <DoorClosedLocked color="white" size={20} />
            </GlassButton> */}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </FadeView>
  );
}
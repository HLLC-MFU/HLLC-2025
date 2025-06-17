import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dimensions,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { ImageBackground } from 'expo-image';
import { useRouter } from 'expo-router';
import { useActivities } from '@/hooks/useActivities';
import useProfile from '@/hooks/useProfile';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Bell, Group, User, Users } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { IconImage } from '@/components/ui/IconImage'

const assetImage = "@/assets/images/"

export default function HomeScreen() {
  const { t } = useTranslation();
  const { activities, loading, error } = useActivities();
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#888" />
      </SafeAreaView>
    );
  }
  return (
    <ImageBackground
      source={require(`${assetImage}lobby.png`)}
      contentFit="cover"
      style={{ flex: 1 }}>
      <SafeAreaView style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 0, alignItems: 'center', justifyContent: 'space-between' }}>
        <GlassButton
        // backgroundImage={require(`${assetImage}IconTest2.png`)}
        >
          <User
            color="white"
            size={20}
            onPress={() => {
              useRouter().push('/(auth)/login');
            }}
          />
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
          <GlassButton
            iconOnly
          // backgroundImage={require(`${assetImage}IconTest.png`)}
          >
            <IconImage>
              <Users color="white" size={20} />
            </IconImage>
          </GlassButton>
          <GlassButton
            iconOnly
          // backgroundImage={require(`${assetImage}IconTest.png`)}
          >
            <IconImage>
              <Bell fill={"white"} color="white" size={20} />
            </IconImage>
          </GlassButton>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

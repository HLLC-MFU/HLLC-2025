import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dimensions,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import HomeHero from '@/components/home/Hero';
import FAB from '@/components/FAB';
import { QrCode , MessageSquare} from 'lucide-react-native';
} 

import { useRouter } from 'expo-router';
import TopNav from '@/components/global/TopNav';
import HomeActivityCard from '@/components/home/ActivityCard';
import { useActivities } from '@/hooks/useActivities';
import SectionHeader from '@/components/home/SectionHeader';
import useProfile from '@/hooks/useProfile';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { user } = useProfile();
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const { t } = useTranslation();
  const { language } = useLanguage();
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
    <View style={{ flex: 1 }}>
      <TopNav />
      <SafeAreaView style={{ flex: 1, top: -36 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <HomeHero style={{ paddingHorizontal: 16 }} />
          <View style={{ top: -60, width: '100%', gap: 16 }}>
            <SectionHeader
              title={t('home.activities')}
              rightText={t('home.seeAll')}
              onPressRight={() => console.log('Pressed See All')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              style={{ gap: 12, flexGrow: 1, height: 200 }}
            >
              <View style={{ width: 16 }}></View>
              {activities
                .filter(
                  activity =>
                    activity.code !== 'LAMDUAN' && activity.code !== 'KHANTOKE',
                )
                .map(activity => (
                  <HomeActivityCard
                    key={activity.id}
                    activity={activity}
                    lang={language}
                    onPress={() =>
                      router.push({
                        pathname: `/activities/[id]`,
                        params: { id: activity.id },
                      })
                    }
                    style={{ width: width * 0.85, marginRight: 16 }}
                  />
                ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

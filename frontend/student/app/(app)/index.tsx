import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dimensions,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import HomeHero from "@/components/home/Hero";
import { Image } from 'expo-image';
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
      <View style={{ top: 36, paddingHorizontal: 16, paddingBottom: 16 }}>
        <HomeHero />
      </View>
    </View>
  );
}

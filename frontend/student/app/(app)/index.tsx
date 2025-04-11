import { SafeAreaView } from "react-native-safe-area-context";
import {
  Dimensions,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import HomeHero from "@/components/home/Hero";
import FAB from "@/components/FAB";
import { QrCode } from "lucide-react-native";

import { useRouter } from "expo-router";
import TopNav from "@/components/global/TopNav";
import HomeActivityCard from "@/components/home/ActivityCard";
import { useActivities } from "@/hooks/useActivities";
import SectionHeader from "@/components/home/SectionHeader";
import useProfile from "@/hooks/useProfile";

export default function HomeScreen() {
  const { user } = useProfile();
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const { activities, loading, error, lang } = useActivities();
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
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
          <View style={{ top: -60, width: "100%", gap: 16 }}>
            <SectionHeader
              title="Activities"
              rightText="See all"
              onPressRight={() => console.log("Pressed See All")}
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
                  (activity) =>
                    activity.code !== "LAMDUAN" && activity.code !== "KHANTOKE"
                )
                .map((activity) => (
                  <HomeActivityCard
                    key={activity.id}
                    activity={activity}
                    lang={lang}
                    onPress={() => router.push({
                      pathname:`/activities/[id]`,
                      params: { id: activity.id },
                    })}
                    style={{ width: width * 0.85, marginRight: 16 }}
                  />
                ))}
            </ScrollView>
          </View>
        </ScrollView>

        <FAB
          icon={QrCode}
          onPress={() => router.push("/qrcode")}
          style={{ backgroundColor: user?.theme.colors.primary }}
        />
      </SafeAreaView>
    </View>
  );
}

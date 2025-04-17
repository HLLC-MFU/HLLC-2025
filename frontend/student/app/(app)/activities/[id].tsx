import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { apiRequest, ApiResponse } from "@/utils/api";
import { Activity } from "@/types/activities";
import { BlurView } from "expo-blur";

import useProfile from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import { useLanguage } from "@/context/LanguageContext";

export default function ActivityDetailScreen() {
  const { language } = useLanguage();
  const { user } = useProfile();
  const router = useRouter();

  // 🧠 ปลอดภัยจาก id แบบ array
  const rawId = useLocalSearchParams().id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
      ? rawId[0]
      : undefined;

  const { activities } = useActivities();
  const cachedActivity = activities.find((a) => a.id === id); // ✅ ค้นจาก Zustand cache

  const [activity, setActivity] = useState<Activity | null>(
    cachedActivity || null
  );
  const [loading, setLoading] = useState(!cachedActivity); // ✅ ถ้ามีข้อมูลแล้วไม่โหลดใหม่
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity || !id || !user?.id) return;

    const loadActivity = async () => {
      setLoading(true);
      const res: ApiResponse<Activity> = await apiRequest(
        `/users/${user.id}/activities/${id}`
      );
      if (res.statusCode === 200 && res.data) {
        setActivity(res.data);
      } else {
        setError(res.message || "Failed to load activity.");
      }
      setLoading(false);
    };

    loadActivity();
  }, [id, user?.id, activity]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#888" />
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "red", fontSize: 16 }}>ไม่พบข้อมูลกิจกรรม</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={{ uri: user?.theme?.assets?.background }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
    >
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView
        style={{
          paddingTop: 16,
          paddingHorizontal: 16,
          zIndex: 99,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={"white"} />
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          Activity Details
        </Text>
        <ArrowLeft color={"transparent"} />
      </SafeAreaView>

      <SafeAreaView
        style={{ flex: 1, paddingHorizontal: 16, marginTop: 0, gap: 16 }}
      >
        <Image
          source={{ uri: activity.banner }}
          style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 16 }}
          contentFit="cover"
        />

        <BlurView
          intensity={60}
          tint="light"
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {activity.name[language]}
          </Text>
          <Text style={{ fontSize: 16, marginTop: 8 }}>
            {activity.description[language]}
          </Text>
        </BlurView>
      </SafeAreaView>
    </ImageBackground>
  );
}

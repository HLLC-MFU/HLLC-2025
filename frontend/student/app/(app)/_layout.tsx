// app/(app)/_layout.tsx
import {
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SplashScreen, Stack } from "expo-router";
import "@/utils/notifications"; 
import { Redirect } from "expo-router";
import { BlurView } from "expo-blur";
import { ImageBackground } from "expo-image";
import useProfile from "@/hooks/useProfile";
import { useEffect, useState } from "react";



export default function Layout() {
  const { user, getProfile } = useProfile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().finally(() => {
      setLoading(false);
      SplashScreen.hideAsync(); // ✅ ซ่อน splash หลังโหลดโปรไฟล์เสร็จ
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <View style={{ flex: 1 }}>
      {/* 🔴 Background Layer */}
      <ImageBackground
        source={{ uri: user.theme?.assets?.background }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      >
        <BlurView
          intensity={100}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* 🟢 Foreground Layer (Stack + Screen content) */}
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "card", // ✅ ให้ animation สวย
          contentStyle: {
            backgroundColor: "transparent", // ✅ ให้ Stack โปร่งใส
          },
        }}
      />
    </View>
  );
}

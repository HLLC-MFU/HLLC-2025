// app/qr.tsx
import { SafeAreaView, View, Text } from "react-native";

import QRCodeGenerator from "@/components/qrcode/generator";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import useProfile from "@/hooks/useProfile";

export default function QRCodePage() {
  const { user } = useProfile();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <MotiView
        from={{ opacity: 0, translateY: 600 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: 600  }}
        transition={{ type: "timing", duration: 300 }}
        style={{
          backgroundColor: "white",
          padding: 36,
          borderRadius: 24,
          alignItems: "center",
          gap: 24,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>{user?.fullName}</Text>
          <Text>Student ID: {user?.username}</Text>
        </View>

        <QRCodeGenerator username={user?.username ?? "defaultUsername"} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: "#2563EB",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

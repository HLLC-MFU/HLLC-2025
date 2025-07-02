import { router } from "expo-router";
import { useActivityStore } from "@/stores/activityStore";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Separator } from "tamagui";
import { ArrowLeft, Compass } from "@tamagui/lucide-icons";
import CheckinStatusChip from "./_components/checkin-status-chip";
import DateBadge from "./_components/date-badge";


export default function ActivityDetailPage() {
  const activity = useActivityStore((s) => s.selectedActivity);

  if (!activity) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#999" }}>No activity data found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Image Section */}
      <View style={{ position: "relative", width: "100%", aspectRatio: 4 / 3 }}>
        <View id={`activity-image-${activity._id}`} style={{ width: "100%", height: "100%" }}>
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.banner}` }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <LinearGradient
          colors={["transparent", "#ffffff80", "#ffffff"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
          }}
          pointerEvents="none"
        />

        <TouchableOpacity
          onPress={() => router.push("/(app)/activities")}
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: 8,
            borderRadius: 999,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft color="#333" size={20} />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={{ padding: 20, gap: 20 }}>
        {/* Title & Info */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, color: "#888", textTransform: "uppercase" }}>Activity</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#222" }}>{activity.name.en}</Text>

          <Text style={{ fontSize: 15, color: "#666" }}>
            Start at{" "}
            {new Date(activity.metadata.startAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={{ fontSize: 15, color: "#666" }}>{activity.location.en}</Text>
          <CheckinStatusChip status={activity.checkinStatus} />
        </View>

        <View style={{ flexDirection: "column", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DateBadge date={activity.metadata.startAt} />

        </View>
        </View>


        <Separator />

        {/* Description */}
        <View>
          <Text style={{ fontSize: 16, lineHeight: 24, color: "#444", textAlign: "justify" }}>
            {activity.fullDetails.en}
          </Text>
        </View>

        <Separator />

        {/* Action Button */}
        <Button
          onPress={() => Linking.openURL("https://maps.app.goo.gl/CWfVTpiP9Xu9BZx4A")}
          icon={Compass}
          style={{
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
          }}
        >
          Get Direction
        </Button>
      </View>
    </View>
  );
}
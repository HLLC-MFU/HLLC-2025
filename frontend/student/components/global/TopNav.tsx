import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Ticket, X, Check, Clock } from "lucide-react-native";

import { useActivities } from "@/hooks/useActivities";
import tinycolor from "tinycolor2";
import { useNotification } from "@/hooks/useNotification";
import NotificationModal from "./NotificationModal";
import useProfile from "@/hooks/useProfile";

// ✅ Define Activity Type
type Activity = {
  code: string;
  name?: { en?: string };
  status?: { step?: number; message?: string };
};

export default function TopNav() {
  const { user } = useProfile();
  const { activities = [] }: { activities: Activity[] } = useActivities();
  const insets = useSafeAreaInsets();
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const { notifications = [] } = useNotification();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (isNotificationVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isNotificationVisible]);

  const completedPercentage = useMemo(() => {
    const validActivities = activities.filter(
      (a) => a.code !== "LAMDUAN" && a.code !== "KHANTOKE"
    );
    if (validActivities.length === 0) return 0;

    const completedCount = validActivities.filter(
      (a) => a.status?.step === 3 && a.status?.message === "success"
    ).length;

    return Math.round((completedCount / validActivities.length) * 100);
  }, [activities]);

  const getStatusInfo = (status?: Activity["status"]) => {
    if (status?.step === 3 && status?.message === "success") {
      return {
        icon: <Check size={16} color="#22c55e" />,
        background: "rgba(34, 197, 94, 0.1)",
      };
    } else if (status?.step === 0) {
      return {
        icon: <Clock size={16} color="#f59e0b" />,
        background: "rgba(245, 158, 11, 0.1)",
      };
    } else {
      return {
        icon: <Clock size={16} color="#6b7280" />,
        background: "rgba(107, 114, 128, 0.1)",
      };
    }
  };

  const getRandomTime = (index: number) => {
    const times = ["Just now", "5m ago", "1h ago", "3h ago", "Yesterday"];
    return times[index % times.length];
  };

  return (
    <>
      {/* Top Navbar */}
      <View
        style={{
          height: 80 + insets.top,
          backgroundColor: "#ffffff00",
          borderColor: "#ffffff10",
          borderWidth: 0.5,
          paddingTop: insets.top,
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        {/* Left */}
        <View>
          <Text style={{ color: "white", fontSize: 14 }}>Welcome Back</Text>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {user?.fullName ?? "Guest"}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: user?.theme?.colors?.primary ?? "#3b82f6",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginTop: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              Progress: {completedPercentage}%
            </Text>
          </View>
        </View>

        {/* Right Icons */}
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              backgroundColor: tinycolor(
                user?.theme?.colors?.primary ?? "#3b82f6"
              )
                .setAlpha(0.2)
                .toRgbString(),
              padding: 6,
              borderRadius: 50,
            }}
          >
            <Ticket color={user?.theme?.colors?.primary ?? "#3b82f6"} />
          </View>

          <TouchableOpacity
            onPress={() => setNotificationVisible(true)}
            style={{
              backgroundColor: tinycolor(
                user?.theme?.colors?.primary ?? "#3b82f6"
              )
                .setAlpha(0.2)
                .toRgbString(),
              padding: 6,
              borderRadius: 50,
              marginLeft: 8,
              position: "relative",
            }}
          >
            <Bell color={user?.theme?.colors?.primary ?? "#3b82f6"} />
            {activities.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: user?.theme?.colors?.primary ?? "#3b82f6",
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.1)",
                }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={isNotificationVisible}
        onClose={() => setNotificationVisible(false)}
      >
      </NotificationModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  notificationContainer: {
    position: "absolute",
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  trianglePointer: {
    position: "absolute",
    top: -8,
    right: 12,
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#000",
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    zIndex: -1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    position: "relative",
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  markAllRead: {
    padding: 12,
    alignItems: "center",
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { Bell, X, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@/hooks/notifications/useNotification";

import tinycolor from "tinycolor2";
import { AnimatePresence, MotiView } from "moti";
import useProfile from "@/hooks/useProfile";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { notifications = [] } = useNotification();
  const { user } = useProfile();

  const [showing, setShowing] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // เปิด Modal ทันทีเมื่อ visible = true
  useEffect(() => {
    if (visible) {
      setShowing(true);
      setAnimatingOut(false);
    } else if (showing) {
      // เริ่มเล่น exit animation
      setAnimatingOut(true);
    }
  }, [visible]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleClose = () => {
    setAnimatingOut(true);
  };

  return (
    <Modal
      visible={showing}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <AnimatePresence
          onExitComplete={() => {
            setShowing(false);
            onClose(); // callback จริง
          }}
        >
          {!animatingOut && visible && (
            <MotiView
              key="modal"
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -10 }}
              transition={{ type: "timing", duration: 250 }}
              style={[styles.notificationContainer, { top: 80 + insets.top }]}
            >
              {/* ✅ Triangle and notification content */}
              <View style={styles.trianglePointer} />

              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <X size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Bell size={40} color="#d1d5db" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                    <Text style={styles.emptySubtext}>
                      We'll notify you when something arrives
                    </Text>
                  </View>
                )}
                renderItem={({ item: n }) => (
                  <TouchableOpacity
                    style={[
                      styles.notificationItem,
                      !n.read && {
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor: tinycolor(
                            user?.theme?.colors?.primary ?? "#3b82f6"
                          )
                            .setAlpha(0.1)
                            .toRgbString(),
                        },
                      ]}
                    >
                      <Check size={16} color={user?.theme?.colors?.primary} />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>
                          {n.title["en"] ?? "Untitled"}
                        </Text>
                        <Text style={styles.timeText}>
                          {new Date(n.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.notificationMessage}>
                        {n.subtitle["en"] ?? "No detail"}
                      </Text>
                    </View>
                    {!n.read && (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: user?.theme.colors.primary },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />

              {notifications.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.markAllRead}>
                    <Text
                      style={[
                        styles.markAllReadText,
                        {
                          color: user?.theme?.colors?.primary ?? "#3b82f6",
                        },
                      ]}
                    >
                      Mark all as read
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </MotiView>
          )}
        </AnimatePresence>
      </Pressable>
    </Modal>
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

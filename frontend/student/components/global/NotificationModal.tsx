import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { Bell, X, Check, ArrowDown, Clock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { use, useEffect, useMemo, useState } from "react";
import { useNotification } from "@/hooks/notifications/useNotification";
import { NotificationItem } from "@/types/notification";
import { Linking } from "react-native";

import tinycolor from "tinycolor2";
import { AnimatePresence, MotiView } from "moti";
import useProfile from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Define interface for user with theme
interface UserWithTheme {
  theme?: {
    colors?: {
      primary?: string;
    };
  };
}

export default function NotificationModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { notifications: originalNotifications = [], loading, markAsRead, markAllAsRead } = useNotification();
  const { user } = useProfile();
  const {language} = useLanguage();
  const [showing, setShowing] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUnread, setShowUnread] = useState(true);

  // Update local notifications when original notifications change
  useEffect(() => {
    setNotifications(originalNotifications);
  }, [originalNotifications]);

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
    () => notifications.filter((n: NotificationItem) => !n.isRead).length,
    [notifications]
  );

  // กรองรายการ notification ตามสถานะที่เลือก
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((n) =>
        showUnread ? !n.isRead : n.isRead
      ),
    [notifications, showUnread]
  );

  const handleClose = () => {
    setAnimatingOut(true);
  };

  const handleMarkAllAsRead = async () => {
    if (markingAsRead || unreadCount === 0) return;
    
    setMarkingAsRead(true);
    try {
      const success = await markAllAsRead();
    } catch (error) {
      // Handle error silently
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleMarkAsRead = async (notification: NotificationItem) => {
    if (!notification._id || notification.isRead) return;
    
    try {
      const success = await markAsRead(notification._id);
    } catch (error) {
      // Handle error silently
    }
  };

  // Function to handle notification click
  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read when clicked
    await handleMarkAsRead(notification);
    
    // Set selected notification for detail view
    setSelectedNotification(notification);
  };

  // Function to get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "AArrowDownIcon":
        return <ArrowDown size={16} />;
      case "AlarmClockPlusIcon":
        return <Clock size={16} />;
      default:
        return <Check size={16} />;
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Type assertion for user with theme
  const userWithTheme = user as UserWithTheme;
  const {t} = useTranslation();

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
            onClose();
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
              <View style={styles.trianglePointer} />
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>{t("notification.title")}</Text>
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
              {/* Tab toggle for unread/read */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabButton, showUnread && styles.tabButtonActive]}
                  onPress={() => setShowUnread(true)}
                >
                  <Text style={[styles.tabText, showUnread && styles.tabTextActive]}>
                    {t("notification.unread")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, !showUnread && styles.tabButtonActive]}
                  onPress={() => setShowUnread(false)}
                >
                  <Text style={[styles.tabText, !showUnread && styles.tabTextActive]}>
                    {t("notification.read")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <FlatList
                data={filteredNotifications}
                keyExtractor={(item: NotificationItem) => item._id}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Bell size={40} color="#d1d5db" />
                    <Text style={styles.emptyText}>{t("notification.noNotifications")}</Text>
                    <Text style={styles.emptySubtext}>
                      {t("notification.noNotificationsSubtext")}
                    </Text>
                  </View>
                )}
                renderItem={({ item: n }: { item: NotificationItem }) => {
                  const isUnread = !n.isRead;
                  return (
                    <TouchableOpacity
                      style={styles.card}
                      activeOpacity={0.85}
                      onPress={() => handleNotificationClick(n)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.iconWrap}>{getIconComponent(n.icon)}</View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{n.title[language] ?? "Untitled"}</Text>
                          <Text style={styles.cardSubtitle}>{n.subtitle[language] ?? "No detail"}</Text>
                        </View>
                        <Text style={styles.cardDate}>
                          {formatDate(n.createdAt || n.timestamp || new Date().toISOString())}
                        </Text>
                      </View>
                      <View style={styles.cardDivider} />
                      <View style={styles.cardBodyRow}>
                        <Text style={styles.cardBody}>{n.body && n.body[language]}</Text>
                        {n.image && n.image.trim() !== "" && (
                          <Image
                            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${n.image}` }}
                            style={styles.cardImage}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      {isUnread && (
                        <View style={styles.unreadDotCard} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
              {notifications.length > 0 && unreadCount > 0 && showUnread && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity 
                    style={styles.markAllRead}
                    onPress={handleMarkAllAsRead}
                    disabled={markingAsRead}
                  >
                    <Text
                      style={[
                        styles.markAllReadText,
                        {
                          color: userWithTheme?.theme?.colors?.primary ?? "#3b82f6",
                          opacity: markingAsRead ? 0.6 : 1,
                        },
                      ]}
                    >
                      {markingAsRead ? t("notification.markingAsRead") : t("notification.markAllAsRead")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </MotiView>
          )}
        </AnimatePresence>
        {/* Detail Modal */}
        <Modal
          visible={!!selectedNotification}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedNotification(null)}
        >
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalCard}>
              <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setSelectedNotification(null)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
              {selectedNotification && (
                <>
                  <View style={styles.detailHeaderRow}>
                    <View style={styles.iconWrap}>{getIconComponent(selectedNotification.icon)}</View>
                    <Text style={styles.detailTitle}>{selectedNotification.title[language]}</Text>
                  </View>
                  <Text style={styles.detailSubtitle}>{selectedNotification.subtitle[language]}</Text>
                  <Text style={styles.detailDate}>{formatDate(selectedNotification.createdAt || selectedNotification.timestamp || new Date().toISOString())}</Text>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailBody}>{selectedNotification.body && selectedNotification.body[language]}</Text>
                  {selectedNotification.image && selectedNotification.image.trim() !== "" && (
                    <Image
                      source={{ uri: `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${selectedNotification.image}` }}
                      style={styles.detailImage}
                      resizeMode="contain"
                    />
                  )}
                  {/* ปุ่มลิงก์ */}
                  {selectedNotification.redirectButton && selectedNotification.redirectButton.url && (
                    <TouchableOpacity
                      style={styles.detailLinkButton}
                      onPress={() => selectedNotification.redirectButton?.url && Linking.openURL(selectedNotification.redirectButton.url)}
                    >
                      <Text style={styles.detailLinkButtonText}>
                        {selectedNotification.redirectButton?.label?.[language] || t("notification.openLink")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
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
    fontSize: 18,
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
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
    marginTop: 2,
  },
  notificationImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginTop: 8,
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
  // Card style for notification list
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    marginVertical: 10,
    marginHorizontal: 12,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
    minHeight: 90,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
  },
  iconWrap: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
    marginBottom: 0,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  cardBody: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginLeft: 12,
    backgroundColor: '#f3f4f6',
  },
  unreadDotCard: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Detail modal styles
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    position: 'relative',
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    width: '100%',
    fontWeight: '500',
  },
  detailDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    width: '100%',
    textAlign: 'right',
    fontWeight: '400',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    width: '100%',
    marginVertical: 10,
  },
  detailBody: {
    fontSize: 17,
    color: '#111827',
    marginBottom: 12,
    width: '100%',
    lineHeight: 24,
    fontWeight: '400',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  detailImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    alignSelf: 'center',
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: "#3b82f6",
  },
  tabText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 15,
  },
  tabTextActive: {
    color: "#fff",
  },
  detailLinkButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  detailLinkButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

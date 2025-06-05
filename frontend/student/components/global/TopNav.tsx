import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Ticket, LogOut } from "lucide-react-native";
import tinycolor from "tinycolor2";

import { useActivities } from "@/hooks/useActivities";
import useProfile from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import NotificationModal from "./NotificationModal";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/useAuth";
import { router } from "expo-router";

type Activity = {
  code: string;
  name?: { en?: string };
  status?: { step?: number; message?: string };
};

export default function TopNav() {
  const { user } = useProfile();
  const { activities = [] }: { activities: Activity[] } = useActivities();
  const { language, changeLanguage } = useLanguage();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const primaryColor = user?.theme?.colors?.primary ?? "#3b82f6";
  const fadedColor = tinycolor(primaryColor).setAlpha(0.2).toRgbString();
  const { t } = useTranslation();
  const completedPercentage = useMemo(() => {
    const valid = activities.filter(a => a.code !== "LAMDUAN" && a.code !== "KHANTOKE");
    const completed = valid.filter(a => a.status?.step === 3 && a.status?.message === "success");
    return valid.length ? Math.round((completed.length / valid.length) * 100) : 0;
  }, [activities]);

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

  const toggleLanguage = () => {
    changeLanguage(language === "th" ? "en" : "th");
  };

  const handleLogout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <View>
      {/* === Top Navbar === */}
      <View style={[styles.navbar, { paddingTop: insets.top, height: 80 + insets.top }]}>
        {/* Left Info */}
        <View>
          <Text style={styles.subtitle}>{t("nav.welcome")}</Text>
          <Text style={styles.username}>{user?.data[0].username ?? "Guest"}</Text>
          <View style={[styles.progressContainer, { backgroundColor: primaryColor }]}>
            <Text style={styles.progressText}>{t("nav.progress")}: {completedPercentage}%</Text>
          </View>
        </View>

        {/* Right Icons */}
        <View style={styles.iconGroup}>
          <CircleIcon icon={<Ticket color={primaryColor} />} background={fadedColor} />

          <TouchableOpacity
            onPress={() => setNotificationVisible(true)}
            style={[styles.iconButton, { backgroundColor: fadedColor, marginLeft: 8 }]}
          >
            <Bell color={primaryColor} />
            {activities.length > 0 && <View style={[styles.dot, { backgroundColor: primaryColor }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleLanguage}
            style={[styles.langButton, { backgroundColor: fadedColor }]}
          >
            <Text style={[styles.langText, { color: primaryColor }]}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.iconButton, { backgroundColor: fadedColor, marginLeft: 8 }]}
          >
            <LogOut color={primaryColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* === Notification Modal === */}
      <NotificationModal
        visible={isNotificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </View>
  );
}

const CircleIcon = ({ icon, background }: { icon: JSX.Element; background: string }) => (
  <View style={[styles.iconButton, { backgroundColor: background }]}>
    {icon}
  </View>
);

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: "#ffffff00",
    borderColor: "#ffffff10",
    borderWidth: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  subtitle: {
    color: "white",
    fontSize: 14,
  },
  username: {
    color: "white",
    fontWeight: "bold",
  },
  progressContainer: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  progressText: {
    color: "white",
    fontSize: 12,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 6,
    borderRadius: 50,
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  langText: {
    fontWeight: "600",
    fontSize: 12,
  },
});

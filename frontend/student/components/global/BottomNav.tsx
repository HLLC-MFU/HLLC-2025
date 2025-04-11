import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, Activity, QrCode, Gift } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  useEffect(() => {
    console.log("Current Router Object:", router);
    console.log("Current Pathname:", pathname);
  }, [pathname]);

  const tabs = [
    { name: "Home", icon: Home, to: "/" }, // Root inside layout.tsx
    { name: "Activities", icon: Activity, to: "/activities" },
    { name: "QRCode", icon: QrCode, to: "/qrcode" },
    { name: "Evoucher", icon: Gift, to: "/evoucher" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.to;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => {
              console.log(`Navigating to: ${tab.to}`);
              router.push(tab.to);
            }}
          >
            <Icon size={24} color={isActive ? "#3b82f6" : "#64748b"} />
            <Text style={[styles.tabLabel, { color: isActive ? "#3b82f6" : "#64748b" }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "95%",
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 0.5,
    position: "absolute",
    paddingHorizontal: "3%",
    marginBottom: 15,
    borderRadius: 9999,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});

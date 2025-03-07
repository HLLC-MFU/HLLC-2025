import { Tabs } from "expo-router";
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}> 
      <ImageBackground
        source={{
          uri: "https://hllc.mfu.ac.th/api/uploads/109faa6b2b629ae15c35f5ae0ca6444d4.jpg",
        }}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Wrap Tabs in a full-height View */}
        <View style={styles.overlay}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarStyle: {
                backgroundColor: "transparent", // ✅ Ensure tab bar is transparent
                position: "absolute",
                borderTopWidth: 0,
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="activities"
              options={{
                title: "Activities",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="paperplane.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="qrcode"
              options={{
                title: "QR Code",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="qrcode" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="evoucher"
              options={{
                title: "E-Voucher",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="ticket.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="notification"
              options={{
                title: "Notification",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="bell" color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, 
  },
  overlay: {
    flex: 1, 
    backgroundColor: "transparent", // ✅ Ensure transparency
  },
});

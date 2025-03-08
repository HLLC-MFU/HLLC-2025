import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
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
  );
}

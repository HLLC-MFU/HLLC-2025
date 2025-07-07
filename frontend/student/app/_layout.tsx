import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { createTamagui, TamaguiProvider } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';
import React from 'react';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrentToast } from '@/context/ToastContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '@/hooks/notifications/backgroundNotificationHandler'

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { left, top, right } = useSafeAreaInsets();
  const config = createTamagui(defaultConfig);

  return (
    // Bugfix: Uncomment the GestureHandlerRootView to fix gesture handling issues (not fix yet)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <TamaguiProvider config={config}>
          <ToastProvider burntOptions={{ from: 'top' }}>
            <LanguageProvider>
              <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
                <ToastViewport
                  flexDirection="column-reverse"
                  top={top}
                  left={left}
                  right={right}
                />
                <CurrentToast />
              </BottomSheetModalProvider>
            </LanguageProvider>
          </ToastProvider>
        </TamaguiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

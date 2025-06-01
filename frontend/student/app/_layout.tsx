import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { createTamagui, TamaguiProvider, View } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';
import React from 'react';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrentToast } from '@/context/ToastContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { left, top, right } = useSafeAreaInsets();
  const config = createTamagui(defaultConfig);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TamaguiProvider config={config}>
        <ToastProvider burntOptions={{ from: 'top' }}>
          <LanguageProvider>
            <Stack>
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
          </LanguageProvider>
        </ToastProvider>
      </TamaguiProvider>
    </ThemeProvider>
  );
}

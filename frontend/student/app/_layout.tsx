import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font'

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { TamaguiProvider } from 'tamagui';
import React, { useEffect } from 'react';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrentToast } from '@/context/ToastContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '@/hooks/notifications/backgroundNotificationHandler'
import { config } from '@/tamagui.config';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import useDevice from '@/hooks/useDevice';
import { Alert, Linking, Platform } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { left, top, right } = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    'NotoSansThai-100': require('../assets/fonts/NotoSansThai-Thin.ttf'),
    'NotoSansThai-300': require('../assets/fonts/NotoSansThai-Light.ttf'),
    'NotoSansThai-400': require('../assets/fonts/NotoSansThai-Regular.ttf'),
    'NotoSansThai-500': require('../assets/fonts/NotoSansThai-Medium.ttf'),
    'NotoSansThai-600': require('../assets/fonts/NotoSansThai-SemiBold.ttf'),
    'NotoSansThai-700': require('../assets/fonts/NotoSansThai-Bold.ttf'),
    'NotoSansThai-900': require('../assets/fonts/NotoSansThai-Black.ttf'),
    'LibreBarcode39': require('../assets/fonts/LibreBarcode39-Regular.ttf'),
  });
  const { checkVersionUpdate } = useDevice();
  useEffect(() => {
    async function checkUpdate() {
      const { updateRequired, latest } = await checkVersionUpdate();
      
      if (updateRequired && latest) {
        Alert.alert(
          'Update Available',
          `A newer version (${latest.appVersion}) is available. Please update the app.`,
          [
            {
              text: 'Update Now',
              onPress: () => {
                const storeUrl =
                  Platform.OS === 'ios'
                    ? 'itms-apps://itunes.apple.com/app/id6748238190'
                    : 'https://hllc.mfu.ac.th/download';
                Linking.openURL(storeUrl);
              },
            },
            {
              text: 'Skip',
              style: 'cancel',
            },
          ],
          { cancelable: false }
        );
      }
    }

    checkUpdate();
  }, [checkVersionUpdate]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;


  return (
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

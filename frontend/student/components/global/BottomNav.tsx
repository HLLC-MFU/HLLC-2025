import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Activity, QrCode, Gift, MessageSquare } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';

type TabPath = '/' | '/activities' | '/qrcode' | '/evoucher' | '/chat';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname(); // Get current route
  const { t } = useTranslation();

  useEffect(() => {
    console.log('Current Router Object:', router);
    console.log('Current Pathname:', pathname);
  }, [pathname]);

  const tabs = [
    { name: t("bottomNav.home"), icon: Home, to: '/' },
    { name: t("bottomNav.activity"), icon: Activity, to: '/activities' },
    { name: 'QRCode', icon: QrCode, to: '/qrcode' },
    { name: t("bottomNav.evoucher"), icon: Gift, to: '/evoucher' },
    { name: t("bottomNav.community"), icon: MessageSquare, to: '/chat' },
  ] as const;


  return (
    <View style={styles.container}>
      {tabs.map((tab, idx) => {
        const isActive = pathname === tab.to;
        const Icon = tab.icon;
        // QRCode button is the middle one (index 2)
        if (tab.name === 'QRCode') {
          return (
            <View key={tab.name} style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => {
                  router.replace(tab.to);
                }}
                activeOpacity={0.85}
              >
                <Icon size={36} color={isActive ? '#fff' : '#fff'} />
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => {
              router.replace(tab.to);
            }}
          >
            <Icon size={24} color={isActive ? '#3b82f6' : '#64748b'} />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? '#3b82f6' : '#64748b' },
              ]}
            >
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 8,
    width: '100%',
    height: 90,
    backgroundColor: 'rgb(255, 255, 255)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 0.5,
    position: 'absolute',
    borderRadius: 24,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  qrButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
});

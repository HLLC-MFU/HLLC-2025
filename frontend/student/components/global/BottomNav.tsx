import { TouchableOpacity, View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, QrCode, Gift, MessageSquare, Book, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ImageBackground } from 'expo-image';

type BottomNav = BottomTabBarProps & {
  backgroundImage?: ImageSourcePropType,
  backgroundQR?: ImageSourcePropType
};

export default function BottomNav({
  backgroundImage,
  backgroundQR,
}: BottomNav) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { name: t("bottomNav.home"), icon: Home, to: '/' },
    { name: t("bottomNav.activity"), icon: Book, to: '/activities' },
    { name: 'QRCode', icon: QrCode, to: '/qrcode' },
    { name: t("bottomNav.evoucher"), icon: Gift, to: '/evoucher' },
    { name: t("bottomNav.community"), icon: Globe, to: '/chat' },
  ] as const;

  const children = tabs.map((tab) => {
    const isActive = pathname === tab.to;
    const Icon = tab.icon;

    if (tab.name === 'QRCode' && !isActive) {
      return (
        <View>
          {backgroundQR ? (
            <ImageBackground
              source={backgroundQR}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                aspectRatio: 1,
              }}
            >
              <Icon size={30} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
                {tab.name}
              </Text>
            </ImageBackground>
          ) : (
            <TouchableOpacity
              key={tab.name}
              style={
                [
                  styles.tabButton,
                  {
                    backgroundColor: 'rgba(0, 122, 255, 0.4)', // Soft blue background
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    aspectRatio: 1,
                  },
                ]
              }
              onPress={() => router.push(tab.to)}
              activeOpacity={0.9}
            >
              <Icon size={30} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
                {tab.name}
              </Text>
            </ TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabButton}
        onPress={() => router.replace(tab.to)}
        activeOpacity={1}
      >
        <Icon size={30} color={isActive ? '#fff' : '#ffffff80'} />
        <Text style={[styles.tabLabel, { color: isActive ? '#fff' : '#ffffff80' }]}>
          {tab.name}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            borderRadius: 999,
            paddingHorizontal: 8,
            overflow: 'hidden',
          }}
        >
          {children}
        </ImageBackground>
      ) : (
        <BlurView intensity={30} tint="light" style={styles.container}>
          {children}
        </BlurView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    height: 70,
    paddingHorizontal: 16,
    zIndex: 100,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});

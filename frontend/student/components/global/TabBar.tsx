import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
    ViewStyle,
    TextStyle,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Home, Book, QrCode, Gift, Globe } from 'lucide-react-native';
import { useAppearance } from '@/hooks/useAppearance';
import AssetImage from './AssetImage';
import { useTranslation } from 'react-i18next';

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

type AllowedRoutes = "/" | "/qrcode" | "/evoucher" | "/community/chat" | "/activities";


export default function GlassTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const { t } = useTranslation();

    const tabs: { key?: string; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; route: AllowedRoutes }[] = [
        { key: 'home', label: t("nav.home"), icon: Home, route: '/' },
        { key: 'activities', label: t("nav.activity"), icon: Book, route: '/activities' },
        { key: 'qrcode', label: t("nav.qrCode"), icon: QrCode, route: '/qrcode' },
        { key: 'evoucher', label: t("nav.evoucher"), icon: Gift, route: '/evoucher' },
        { key: 'community', label: t("nav.community"), icon: Globe, route: '/community/chat' },
    ];
    const { assets } = useAppearance();

    const tabWidth = (width - 48) / tabs.length;
    const offsetX = useSharedValue(0);
    const scale = useSharedValue(1);
    const prevIndexRef = useRef(0);

    useEffect(() => {
        const currentIndex = tabs.findIndex((tab) => tab.route === pathname);

        if (currentIndex !== -1) {
            offsetX.value = withSpring(currentIndex * tabWidth, { damping: 15 });
            scale.value = withSpring(1.15, { damping: 10 });

            setTimeout(() => {
                scale.value = withSpring(1, { damping: 15 });
            }, 200);

            prevIndexRef.current = currentIndex;
        }
    }, [pathname]);

    const animatedPillStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: offsetX.value + 8 },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={Platform.OS === 'ios' ? 30 : 80} tint="dark" style={styles.navContainer}>
                {/* Focus pill */}
                <Animated.View
                    style={[
                        styles.focusPill,
                        { width: tabWidth } as ViewStyle,
                        animatedPillStyle,
                    ]}
                >
                    <BlurView tint="light" intensity={60} style={styles.blurInsidePill} />
                </Animated.View>

                {tabs.map((tab) => {
                    const key = tab.key ? tab.key.toLowerCase() : '';
                    const asset = assets[key];
                    const isActive = pathname === tab.route;
                    const Icon = tab.icon;

                    return (
                        <TouchableOpacity
                            key={tab.route}
                            onPress={() => {
                                if (pathname !== tab.route) {
                                    router.push(tab.route);
                                }
                            }}
                            style={styles.tabItem}
                            activeOpacity={1}
                        >
                            {asset ? (
                                <AssetImage uri={`${baseImageUrl}/uploads/${asset}`} style={{ width: 32, height: 32 }} />
                            ) : (
                                <Icon size={32} color={isActive ? '#fff' : '#ffffff70'} />
                            )}
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: isActive ? '#fff' : '#ffffff70' } as TextStyle,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </View>
    );
}


const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        height: 65,
        borderRadius: 37.5,
        overflow: 'visible',
    },
    navContainer: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 37.5,
        paddingHorizontal: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    focusPill: {
        position: 'absolute',
        height: 48,
        borderRadius: 999,
        overflow: 'hidden',
        zIndex: 0,
        shadowColor: '#fff',
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    blurInsidePill: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    tabItem: {
        flex: 1,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabLabel: {
        fontSize: 8,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',

    },
});

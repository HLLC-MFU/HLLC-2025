import { SafeAreaView, View, Text, StyleSheet, Alert, useWindowDimensions, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';

import QRCodeGenerator from '@/components/qrcode/generator';
import { TouchableOpacity } from 'react-native';
import useProfile from '@/hooks/useProfile';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { apiRequest } from '@/utils/api';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import Barcode from '@/components/qrcode/barcode';

export default function QRCodeScreen() {
  const { user, getProfile } = useProfile();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const initialTab = params.tab === 'scan' ? 'scan' : 'qr';
  const [selectedTab, setSelectedTab] = useState<'qr' | 'scan'>(initialTab);
  const [showScanner, setShowScanner] = useState(initialTab === 'scan');
  const { width } = useWindowDimensions();
  const tabBarPadding = 8;
  const tabWidth = (width - 128 - tabBarPadding * 2) / 2; // 2 tabs
  const offsetX = useSharedValue(0);
  const scale = useSharedValue(1);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { language } = useLanguage();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const router = useRouter();
  const scanningRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (params.tab === 'scan') {
      setSelectedTab('scan');
      setShowScanner(true);
    }
  }, [params.tab, params.t]);

  // ปิดกล้องเมื่อออกจากหน้า qrcode (เช็ค pathname)
  useEffect(() => {
    if (!pathname.includes('/qrcode')) {
      resetScanner()
    }
  }, [pathname]);

  useEffect(() => {
    const currentIndex = selectedTab === 'qr' ? 0 : 1;
    offsetX.value = withSpring(currentIndex * tabWidth, { damping: 15 });
    scale.value = withSpring(1.12, { damping: 10 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 180);
  }, [selectedTab]);

  // Auto-request camera permission when switching to scan tab
  useEffect(() => {
    if (selectedTab === 'scan' && permission && !permission.granted) {
      requestPermission();
    }
  }, [selectedTab, permission, requestPermission]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value + tabBarPadding },
      { scale: scale.value },
    ],
  }));

  // --- Utility Functions ---
  function showErrorAlert(message: string, resetScanner: () => void) {
    Alert.alert('Warning', message);
    resetScanner();
  }

  function validateAndParseHLLCQR(data: string): { qrPath: string, qrPayload: string } | null {
    if (!data.startsWith('hllc:')) return null;
    const jsonStr = data.slice(5);
    let qrObj: Record<string, string>;
    try {
      qrObj = JSON.parse(jsonStr);
    } catch {
      return null;
    }
    const [qrPath, qrPayload] = Object.entries(qrObj)[0] || [];
    if (!qrPath || !qrPayload) return null;
    return { qrPath, qrPayload };
  }

  // --- Helper to reset scanner state ---
  const resetScanner = () => {
    setShowScanner(false);
    setSelectedTab('qr');
    scanningRef.current = false;
    setScanning(false);
  };

  // --- Helper to go to coin-hunting modal ---
  const goToCoinHuntingModal = (params: Record<string, any>) => {
    resetScanner();
    setTimeout(() => {
      router.replace({ pathname: '/community/coin-hunting', params });
    }, 100);
  };

  // --- Main scan handler ---
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    // validate QR
    const parsed = validateAndParseHLLCQR(data);
    if (!parsed) {
      showErrorAlert('This qr code not join hllc', resetScanner);
      return;
    }
    const { qrPath, qrPayload } = parsed;

    try {
      if (!user?.data?.[0]?._id) {
        showErrorAlert('User not found', resetScanner);
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showErrorAlert('ต้องอนุญาตให้เข้าถึงตำแหน่งเพื่อเช็คอิน', resetScanner);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const userLat = location.coords.latitude;
      const userLong = location.coords.longitude;
      const userId = user.data[0]._id;
      const path = `/${qrPath}`;
      let body: any = { user: userId, userLat, userLong };
      const payloadTrimmed = qrPayload.trim();
      if (payloadTrimmed.startsWith('{') || payloadTrimmed.startsWith('[')) {
        try {
          const parsedPayload = JSON.parse(payloadTrimmed);
          body = { ...body, ...parsedPayload };
        } catch (e) {
          showErrorAlert('QR code payload ไม่ถูกต้อง', resetScanner);
          return;
        }
      } else {
        body = qrPath === 'coin-collections/collect'
          ? { ...body, landmark: qrPayload.trim() }
          : { ...body, id: qrPayload.trim() };
      }
      const res = await apiRequest<{ evoucher?: { code: string } | null }>(
        path,
        'POST',
        body
      );
      if (qrPath === 'coin-collections/collect') {
        if (res.statusCode === 200 || res.statusCode === 201) {
          goToCoinHuntingModal({ modal: 'success', code: res?.data?.evoucher?.code });
        } else if (res.statusCode === 409 || (res.message && res.message.toLowerCase().includes('already'))) {
          goToCoinHuntingModal({ modal: 'alert', type: 'already-collected' });
        } else if (res.statusCode === 204 || (res.message && res.message.toLowerCase().includes('no new evoucher'))) {
          goToCoinHuntingModal({ modal: 'alert', type: 'no-evoucher' });
        } else if (res.statusCode === 403 || (res.message && res.message.toLowerCase().includes('too far'))) {
          goToCoinHuntingModal({ modal: 'alert', type: 'too-far' });
        } else if (res.statusCode === 429 || (res.message && res.message.toLowerCase().includes('cooldown'))) {
          const remainingCooldownMs = res.remainingCooldownMs || 0;
          goToCoinHuntingModal({ 
            modal: 'alert', 
            type: 'cooldown',
            remainingCooldownMs
          });
        } else {
          showErrorAlert(res.message || 'Check in failed', resetScanner);
        }
        return;
      }
    } catch (e) {
      showErrorAlert('Scan failed', resetScanner);
      return;
    }
    resetScanner();
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', top: -72 }}>
      {/* Animated Segmented Toggle (fixed at top) */}
      <View style={styles.tabBarWrapper}>
        <BlurView intensity={30} tint="light" style={styles.tabBarBlur}>
          <View style={styles.tabBarContainer}>
            {/* Focus pill */}
            <Animated.View
              style={[
                styles.focusPill,
                { width: tabWidth },
                animatedPillStyle,
              ]}
            >
              <BlurView tint="light" intensity={60} style={styles.blurInsidePill} />
            </Animated.View>
            {/* Tabs */}
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => {
                setSelectedTab('qr');
                setShowScanner(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabBtnText, selectedTab === 'qr' && styles.tabBtnTextActive]}>{t("qrCode.qrCode")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => {
                setSelectedTab('scan');
                setShowScanner(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabBtnText, selectedTab === 'scan' && styles.tabBtnTextActive]}>{t("qrCode.camera")}</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* แสดง QR หรือ Scanner ตาม state */}
      <View style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        {selectedTab === 'qr' && (
          <BlurView
            intensity={40}
            tint="light"
            style={{
              borderRadius: 20,
              padding: 24,
              overflow: "hidden",
              backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.3)",
              borderWidth: 1,
              borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              width: '90%',
              maxWidth: 400,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 }}>
                {user?.data[0].name.first}  {user?.data[0].name.last}
              </Text>
              <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 4 }}>{t("qrCode.studentId")}: {user?.data[0].username}</Text>
              <Text style={{ color: '#fff', marginBottom: 24, textAlign: 'center' }}>{t("qrCode.schoolOf")}{user?.data[0].metadata?.major?.school?.name[language] ?? "-"}</Text>

              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeGenerator username={user?.data[0].username ?? 'defaultUsername'} />
                <Barcode value={user?.data[0].username ?? 'defaultUsername'} />
              </View>
            </View>
          </BlurView>
        )}

        {selectedTab === 'scan' && (
          <BlurView
            intensity={40}
            tint="light"
            style={{
              borderRadius: 20,
              padding: 18,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              position: 'relative',
              overflow: 'hidden',
              width: 320,
              maxWidth: '90%',
            }}
          >
            {/* Camera Switch Button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 24,
                padding: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 4,
              }}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="flip-camera-ios" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 260, height: 260, borderRadius: 16, overflow: 'hidden', marginBottom: 18, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
              {!permission ? (
                <Text style={{ color: '#fff', textAlign: 'center' }}>Requesting camera permission...</Text>
              ) : !permission.granted ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>No access to camera</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                    onPress={requestPermission}
                  >
                    <Text style={{ color: '#333', fontWeight: 'bold' }}>Grant Permission</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}>
                  <CameraView
                    style={{ width: '100%', height: '100%' }}
                    facing={facing}
                    onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
                  />
                </View>
              )}
            </View>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Scan QR Code to Check In</Text>
          </BlurView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    marginHorizontal: 64,
    marginVertical: 16,
    borderRadius: 99,
    overflow: 'hidden',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: 'stretch',
  },
  tabBarBlur: {
    backgroundColor: Platform.OS === "ios" ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 99,
    padding: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusPill: {
    position: 'absolute',
    left: 0,
    height: 34,
    borderRadius: 99,
    overflow: 'hidden',
    zIndex: 0,
    shadowColor: '#fff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  blurInsidePill: {
    flex: 1,
    backgroundColor: Platform.OS === "ios" ? 'rgba(214, 214, 224, 0.18)' : 'rgba(0, 0, 0, 0.18)',
  },
  tabBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff70',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
});

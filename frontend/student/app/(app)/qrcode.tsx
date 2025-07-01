import { SafeAreaView, View, Text, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

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

export default function QRCodePage() {
  const { user, getProfile } = useProfile();
  const {t} = useTranslation();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'qr' | 'scan'>('qr');
  const { width } = useWindowDimensions();
  const tabBarPadding = 8;
  const tabWidth = (width - 128 - tabBarPadding * 2) / 2; // 2 tabs
  const offsetX = useSharedValue(0);
  const scale = useSharedValue(1);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { language } = useLanguage();

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    const currentIndex = selectedTab === 'qr' ? 0 : 1;
    offsetX.value = withSpring(currentIndex * tabWidth, { damping: 15 });
    scale.value = withSpring(1.12, { damping: 10 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 180);
  }, [selectedTab]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value + tabBarPadding },
      { scale: scale.value },
    ],
  }));

  // สำหรับกล้อง
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);
    try {
      if (!user?.data?.[0]?._id) {
        Alert.alert('ผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
        setSelectedTab('qr');
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องอนุญาต', 'ต้องอนุญาตให้เข้าถึงตำแหน่งเพื่อเช็คอิน');
        setSelectedTab('qr');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const userLat = location.coords.latitude;
      const userLong = location.coords.longitude;
      const userId = user.data[0]._id;
      const landmark = data;
      const res = await apiRequest<{ evoucher?: { code: string } | null }>(
        '/coin-collections/collect',
        'POST',
        { user: userId, landmark, userLat, userLong }
      );
      if (res.statusCode === 200 || res.statusCode === 201) {
        Alert.alert('สำเร็จ', 'สแกนสำเร็จ!');
        setSelectedTab('qr');
      } else if (res.statusCode === 409 || (res.message && res.message.toLowerCase().includes('already'))) {
        Alert.alert('แจ้งเตือน', 'คุณได้เช็คอินจุดนี้แล้ว');
        setSelectedTab('qr');
      } else if (res.statusCode === 204 || (res.message && res.message.toLowerCase().includes('no new evoucher'))) {
        Alert.alert('แจ้งเตือน', 'ไม่มี evoucher สำหรับจุดนี้');
        setSelectedTab('qr');
      } else if (res.statusCode === 403 || (res.message && res.message.toLowerCase().includes('too far'))) {
        Alert.alert('แจ้งเตือน', 'คุณอยู่ไกลเกินไป');
        setSelectedTab('qr');
      } else {
        Alert.alert('ผิดพลาด', res.message || 'Check in failed');
        setSelectedTab('qr');
      }
    } catch (e) {
      Alert.alert('ผิดพลาด', 'Check in failed');
      setSelectedTab('qr');
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center'  }}
    >
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
      {selectedTab === 'qr' && (
        <BlurView
          intensity={40}
          tint="light"
          style={{
            borderRadius: 20,
            padding: 32,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
              {user?.data[0].name.first}  {user?.data[0].name.last}
            </Text>
            <Text style={{color: '#fff'}}>{t("qrCode.studentId")}: {user?.data[0].username}</Text>
            <Text style={{color: '#fff', marginBottom: 16}}>{t("qrCode.schoolOf")}{user?.data[0].metadata.major.school.name[language]}</Text>
          </View>

          <QRCodeGenerator username={user?.data[0].username ?? 'defaultUsername'} />
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
                  facing="back"
                  onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
                />
              </View>
            )}
          </View>
          <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Scan QR Code to Check In</Text>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    marginHorizontal: 64,
    marginTop: 84,
    marginBottom: 72,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    top: 4,
    height: 44,
    borderRadius: 99,
    overflow: 'hidden',
    zIndex: 0,
    shadowColor: '#fff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  blurInsidePill: {
    flex: 1,
    backgroundColor: 'rgba(214, 214, 224, 0.18)',
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
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff70',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
});

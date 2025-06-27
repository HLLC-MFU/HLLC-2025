import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
  ViewStyle,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '@/utils/api';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import useProfile from '@/hooks/useProfile';

const screen = Dimensions.get('window');

// 🎯 Marker positions (pixel coordinates relative to original image)
// Mockup: เพิ่มข้อมูล image, description, mapsUrl
const markers = [
  {
    x: 600,
    y: 1100,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },
  {
    x: 900,
    y: 400,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    description:
      'ใต้ถุนอาคาร E2 ประกอบด้วยร้านอาหาร 8 ร้าน ร้านอาหารว่างและเครื่องดื่ม 3 ร้าน เปิดบริการตั้งแต่เวลา 07.00 - 18.00 น.ทุกวัน ด้วยความจุ 350 ที่นั่ง สามารถรองรับผู้ใช้บริการได้กว่า 1,500 คนต่อวัน',
    mapsUrl: 'https://maps.app.goo.gl/FUoQPiJTsr6rQHAQA?g_st=ipc',
  },

];

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}


export default function CoinHuntingScreen() {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [minScale, setMinScale] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<
    (typeof markers)[0] | null
  >(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const { user } = useProfile();

  // Debug: ตรวจสอบ permission
  useEffect(() => {
    console.log('Camera permission:', permission);
  }, [permission]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest<any>('/maps');
        const maps = res.data?.data || [];
        if (maps.length > 0) {
          const url = `${process.env.EXPO_PUBLIC_API_URL?.trim()}/uploads/${
            maps[0].map
          }`;
          setImageUrl(url);
          // โหลดขนาดภาพ
          Image.getSize(
            url,
            (w, h) => {
              setImageSize({ width: w, height: h });
              const scaleW = screen.width / w;
              const scaleH = screen.height / h;
              const min = Math.max(scaleW, scaleH);
              setMinScale(min);
              scale.value = min;
            },
            err => {
              setError('Failed to load map image.');
            },
          );
        } else {
          setError('No map data found.');
        }
      } catch (e) {
        setError('An error occurred while loading the map.');
      }
    })();
  }, []);

  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = clamp(ctx.startScale * event.scale, minScale, 3);
    },
  });

  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;

      const boundX = (scaledWidth - screen.width) / 2;
      const boundY = (scaledHeight - screen.height) / 2;

      translateX.value = clamp(
        ctx.startX + event.translationX,
        -boundX,
        boundX,
      );
      translateY.value = clamp(
        ctx.startY + event.translationY,
        -boundY,
        boundY,
      );
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    width: imageSize.width,
    height: imageSize.height,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <View
          style={{ padding: 24, backgroundColor: '#fff2f2', borderRadius: 12 }}
        >
          <Text
            style={{
              color: '#d00',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        </View>
      </View>
    );
  }
  if (!imageSize.width || !imageUrl) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onGestureEvent={panHandler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={[animatedStyle, styles.imageWrapper]}>
              {/* 🗺️ แผนที่ */}
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />

              {/* 📌 Markers */}
              {markers.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.marker,
                    {
                      top: m.y,
                      left: m.x,
                    } as ViewStyle,
                  ]}
                  onPress={() => setSelectedMarker(m)}
                  activeOpacity={0.7}
                />
              ))}

              {/* 🌫️ เงาด้านบน */}
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={styles.topShadow}
              />

              {/* 🌫️ เงาด้านล่าง */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={styles.bottomShadow}
              />
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>

      {/* Modal for marker detail */}
      <Modal
        visible={!!selectedMarker}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMarker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <BlurView intensity={40} tint="dark" style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedMarker(null)}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>×</Text>
              </TouchableOpacity>
              {selectedMarker && (
                <>
                  <Image
                    source={{ uri: selectedMarker.image }}
                    style={styles.modalImage}
                  />
                  <Text style={styles.modalText}>
                    {selectedMarker.description}
                  </Text>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => Linking.openURL(selectedMarker.mapsUrl)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('@/assets/images/google.png')} style={{ width: 20, height: 20, marginRight: 6, resizeMode: 'contain' }} />
                        <Text style={styles.modalButtonText}>Google Maps</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton]}
                      onPress={() => {
                        setShowScanner(true);
                        setSelectedMarker(null);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="qrcode-scan" size={20} color="#222" style={{ marginRight: 6 }} />
                        <Text style={[styles.modalButtonText, { color: '#333' }]}>Check in Now</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Modal: QR Scanner */}
      <Modal
        visible={showScanner}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <BlurView intensity={40} tint="dark" style={styles.modalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowScanner(false)}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>×</Text>
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
                      facing="back"
                      onBarcodeScanned={scanning ? undefined : async ({ data }: { data: string }) => {
                        setScanning(true);
                        try {
                          if (!user?.data?.[0]?._id) {
                            alert('ไม่พบข้อมูลผู้ใช้');
                            setShowScanner(false);
                            return;
                          }
                          // ขอ permission location ถ้ายังไม่ได้
                          let { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== 'granted') {
                            alert('ต้องอนุญาตให้เข้าถึงตำแหน่งเพื่อเช็คอิน');
                            setShowScanner(false);
                            return;
                          }
                          const location = await Location.getCurrentPositionAsync({});
                          const userLat = location.coords.latitude;
                          const userLong = location.coords.longitude;
                          const userId = user.data[0]._id;
                          const landmark = data; // landmark id จาก QR
                          console.log('[SCAN]', { userId, landmark, userLat, userLong });
                          const res = await apiRequest('/coin-collections/collect', 'POST', {
                            user: userId,
                            landmark,
                            userLat,
                            userLong
                          });
                          console.log('[SCAN][RESPONSE]', res);
                          if (res.statusCode === 200 || res.statusCode === 201) {
                            setShowScanner(false);
                            setShowSuccess(true);
                          } else {
                            alert(res.message || 'Check in failed');
                            setShowScanner(false);
                          }
                        } catch (e) {
                          console.log('[SCAN][ERROR]', e);
                          alert('Check in failed');
                          setShowScanner(false);
                        } finally {
                          setScanning(false);
                        }
                      }}
                    />
                  </View>
                )}
              </View>
              <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Scan QR Code to Check In</Text>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Modal: Check In Success */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <BlurView intensity={40} tint="dark" style={styles.modalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowSuccess(false)}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>×</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialCommunityIcons name="check" size={80} color="#fff" />
                </View>
                <Text style={{ color: '#22ff55', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>Check In Complete!</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                onPress={() => {
                  setShowSuccess(false);
                  router.push('/stamp' as any);
                }}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#222" style={{ marginRight: 6 }} />
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Go to Stamp Page</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    alignSelf: 'center',
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'red',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 5,
  },
  topShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 10,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 10,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalContent: {
    width: 320,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: 260,
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  modalText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  modalButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 

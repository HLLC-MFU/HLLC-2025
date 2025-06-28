import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { apiRequest } from '@/utils/api';
import useProfile from '@/hooks/useProfile';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (evoucher?: { code: string } | null) => void;
  onAlert: (type: 'already-collected' | 'no-evoucher' | 'too-far') => void;
}

export default function QRScannerModal({ visible, onClose, onSuccess, onAlert }: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useProfile();

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    
    setScanning(true);
    try {
      if (!user?.data?.[0]?._id) {
        alert('ไม่พบข้อมูลผู้ใช้');
        onClose();
        return;
      }
      
      // ขอ permission location ถ้ายังไม่ได้
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('ต้องอนุญาตให้เข้าถึงตำแหน่งเพื่อเช็คอิน');
        onClose();
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
      }) as { statusCode: number; message?: string; data?: { evoucher?: { code: string } | null } };
      
      console.log('[SCAN][RESPONSE]', res);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        onClose();
        onSuccess(res.data?.evoucher || null);
      } else if (res.statusCode === 409 || (res.message && res.message.toLowerCase().includes('already'))) {
        onClose();
        onAlert('already-collected');
      } else if (res.statusCode === 204 || (res.message && res.message.toLowerCase().includes('no new evoucher'))) {
        onClose();
        onAlert('no-evoucher');
      } else if (res.statusCode === 403 || (res.message && res.message.toLowerCase().includes('too far'))) {
        onClose();
        onAlert('too-far');
      } else {
        alert(res.message || 'Check in failed');
        onClose();
      }
    } catch (e) {
      console.log('[SCAN][ERROR]', e);
      alert('Check in failed');
      onClose();
    } finally {
      setScanning(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentWrapper}>
          <BlurView intensity={40} tint="dark" style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>×</Text>
            </TouchableOpacity>
            <View style={styles.scannerContainer}>
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
                <View style={styles.cameraContainer}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  scannerContainer: {
    width: 260,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
}); 
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onGoToStamp: () => void;
  evoucher?: { code: string } | null;
}

export default function SuccessModal({ visible, onClose, onGoToStamp, evoucher }: SuccessModalProps) {
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
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons name="check" size={80} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Check In Complete!</Text>
              
              {/* แสดงข้อมูล evoucher ถ้ามี */}
              {evoucher && (
                <View style={styles.evoucherContainer}>
                  <MaterialCommunityIcons 
                    name="gift" 
                    size={24} 
                    color="#fbbf24" 
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.evoucherTitle}>🎉 Congratulations!</Text>
                  <Text style={styles.evoucherText}>
                    You got an evoucher!
                  </Text>
                  <View style={styles.evoucherCodeContainer}>
                    <Text style={styles.evoucherCodeLabel}>Voucher Code:</Text>
                    <Text style={styles.evoucherCode}>{evoucher.code}</Text>
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.stampButton}
              onPress={onGoToStamp}
            >
              <MaterialCommunityIcons 
                name="qrcode-scan" 
                size={20} 
                color="#222" 
                style={{ marginRight: 6 }} 
              />
              <Text style={styles.stampButtonText}>Go to Stamp Page</Text>
            </TouchableOpacity>
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
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    color: '#22ff55',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  evoucherContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    width: '100%',
  },
  evoucherTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  evoucherText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  evoucherCodeContainer: {
    alignItems: 'center',
  },
  evoucherCodeLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  evoucherCode: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  stampButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 
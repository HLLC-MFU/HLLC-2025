import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type AlertType = 'already-collected' | 'no-evoucher' | 'too-far';

interface AlertModalProps {
  visible: boolean;
  alertType: AlertType | null;
  onClose: () => void;
}

export default function AlertModal({ visible, alertType, onClose }: AlertModalProps) {
  const getAlertConfig = (type: AlertType) => {
    switch (type) {
      case 'already-collected':
        return {
          icon: 'check-circle',
          iconColor: '#f59e0b',
          title: 'Already Collected!',
          message: 'You have already collected this landmark. No new coins available.',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          titleColor: '#f59e0b',
        };
      case 'no-evoucher':
        return {
          icon: 'gift-off',
          iconColor: '#6b7280',
          title: 'No Evoucher Available',
          message: 'Sorry, no new evoucher is available for you at this time.',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)',
          titleColor: '#6b7280',
        };
      case 'too-far':
        return {
          icon: 'map-marker-distance',
          iconColor: '#ef4444',
          title: 'Too Far from Landmark',
          message: 'You are too far from the landmark. Please move closer to check in.',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          titleColor: '#ef4444',
        };
      default:
        return {
          icon: 'alert-circle',
          iconColor: '#6b7280',
          title: 'Alert',
          message: 'Something went wrong.',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)',
          titleColor: '#6b7280',
        };
    }
  };

  if (!alertType) return null;

  const config = getAlertConfig(alertType);

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
              <View style={[styles.alertIcon, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
                <MaterialCommunityIcons 
                  name={config.icon as any} 
                  size={60} 
                  color={config.iconColor} 
                />
              </View>
              <Text style={[styles.alertTitle, { color: config.titleColor }]}>
                {config.title}
              </Text>
              <Text style={styles.alertMessage}>
                {config.message}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.okButton}
              onPress={onClose}
            >
              <Text style={styles.okButtonText}>OK</Text>
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
  alertIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  okButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Types for alert
const ALERT_CONFIGS = {
  'already-collected': {
    icon: 'check-circle',
    iconColor: '#f59e0b',
    title: 'Already Collected!',
    message: 'You have already collected this landmark. No new coins available.',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    titleColor: '#f59e0b',
  },
  'no-evoucher': {
    icon: 'gift-off',
    iconColor: '#6b7280',
    title: 'No Evoucher Available',
    message: 'Sorry, no new evoucher is available for you at this time.',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    titleColor: '#6b7280',
  },
  'too-far': {
    icon: 'map-marker-distance',
    iconColor: '#ef4444',
    title: 'Too Far from Landmark',
    message: 'You are too far from the landmark. Please move closer to check in.',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    titleColor: '#ef4444',
  },
  'cooldown': {
    icon: 'clock-alert',
    iconColor: '#3b82f6',
    title: 'Landmark is in Cooldown',
    message: 'This landmark is in cooldown. Please try again later.',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    titleColor: '#3b82f6',
  },
  default: {
    icon: 'alert-circle',
    iconColor: '#6b7280',
    title: 'Alert',
    message: 'Something went wrong.',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    titleColor: '#6b7280',
  },
};

type ModalType = 'success' | 'alert';
type AlertType = 'already-collected' | 'no-evoucher' | 'too-far' | 'cooldown';

interface CombinedModalProps {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
  // For success
  onGoToStamp?: () => void;
  evoucher?: { code: string } | null;
  // For alert
  alertType?: AlertType;
}

export default function CombinedModal({
  visible,
  type,
  onClose,
  onGoToStamp,
  evoucher,
  alertType,
}: CombinedModalProps) {
  if (!visible) return null;

  // Alert config
  const config =
    type === 'alert' && alertType
      ? ALERT_CONFIGS[alertType] || ALERT_CONFIGS.default
      : ALERT_CONFIGS.default;

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
            {type === 'success' ? (
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons name="check" size={80} color="#fff" />
                </View>
                <Text style={styles.successTitle}>Check In Complete!</Text>
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
            ) : (
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View
                  style={[
                    styles.alertIcon,
                    {
                      backgroundColor: config.backgroundColor,
                      borderColor: config.borderColor,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={60}
                    color={config.iconColor}
                  />
                </View>
                <Text style={[styles.alertTitle, { color: config.titleColor }]}> {config.title} </Text>
                <Text style={styles.alertMessage}> {config.message} </Text>
              </View>
            )}
            {type === 'success' ? (
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
            ) : (
              <TouchableOpacity style={styles.okButton} onPress={onClose}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            )}
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
  // Success styles
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
  // Alert styles
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
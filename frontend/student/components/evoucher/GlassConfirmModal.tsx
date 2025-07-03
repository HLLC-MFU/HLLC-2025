import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const GlassConfirmModal = ({
  visible,
  onCancel,
  onConfirm,
  isLoading = false,
  title = 'ยืนยัน',
  message = '',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
}: GlassConfirmModalProps) => (
  <Modal
    transparent={true}
    visible={visible}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.confirmOverlay}>
      <BlurView intensity={40} tint="light" style={styles.confirmContainer}>
        <Text style={styles.confirmTitle}>{title}</Text>
        {!!message && <Text style={styles.confirmMessage}>{message}</Text>}
        <View style={styles.confirmButtonRow}>
          <TouchableOpacity
            style={[styles.confirmButton, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, styles.confirmButtonActive]}
            onPress={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  confirmButtonActive: {
    backgroundColor: '#4caf50',
  },
  cancelButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GlassConfirmModal; 
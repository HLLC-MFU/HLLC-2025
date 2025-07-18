import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  username?: string;
  mode?: 'submit' | 'save';
}

export default function ConfirmModal({
  isVisible,
  onCancel,
  onConfirm,
  username,
  mode = 'submit',
}: ConfirmModalProps) {

  const { t, i18n } = useTranslation();

  const ModalContent = (
    <View style={Platform.OS === 'ios' ? styles.modalBoxIOS : styles.modalBoxAndroid}>
      <Text style={styles.headerText}>
        {mode === 'save' ? t('lamduanflower.confirmSave') : t('lamduanflower.confirmSubmit')}
      </Text>

      <Text style={styles.noteText}>{t('lamduanflower.actioncannot')}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('lamduanflower.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmText}>{t('lamduanflower.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={50} tint="light" style={styles.blurWrapper}>
                {ModalContent}
              </BlurView>
            ) : (
              ModalContent
            )}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalBoxIOS: {
    width: '85%',
    borderRadius: 20,
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBoxAndroid: {
    width: '85%',
    borderRadius: 20,
    padding: 30,
    backgroundColor: 'rgba(136, 136, 136, 0.75)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  cancelButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#fff',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: '#006FEE',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

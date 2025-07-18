import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

interface StatusModalProps {
  isVisible: boolean;
  onClose: () => void;
  status: 'not-started' | 'ended' | 'active';
}

export default function StatusModal({ isVisible, onClose, status }: StatusModalProps) {
  const { t, i18n } = useTranslation();

  const getStatusMessage = () => {
    switch (status) {
      case 'not-started':
        return t('lamduanflower.notStarted');
      case 'ended':
        return t('lamduanflower.ended');
      case 'active':
      default:
        return '';
    }
  };

  if (status === 'active') return null;

  const ModalContent = (
    <View style={Platform.OS === 'ios' ? styles.modalBoxIOS : styles.modalBoxAndroid}>
      <Text style={styles.headerText}>{t('lamduanflower.warning')}</Text>
      <Text style={styles.bodyText}>{getStatusMessage()}</Text>

      <TouchableOpacity style={styles.okButton} onPress={onClose}>
        <Text style={styles.okText}>{t('lamduanflower.ok')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
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
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalBoxIOS: {
    width: '80%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 68,
  },
  modalBoxAndroid: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: 300,
    alignItems: 'center',
    backgroundColor: 'rgba(136, 136, 136, 0.75)',
    borderRadius: 20,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF9F00',
    marginBottom: 12,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  okButton: {
    alignSelf: 'center',
    backgroundColor: '#FFB22C',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  okText: {
    color: '#fff',
    fontWeight: '600',
  },
});

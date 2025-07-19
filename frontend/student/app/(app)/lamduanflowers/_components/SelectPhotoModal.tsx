import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Camera, Image as Gallery } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

type SelectPhotoModalProps = {
  visible: boolean
  onClose: () => void
  onTakePhoto: () => void
  onPickImage: () => void
}

export default function SelectPhotoModal({
  visible,
  onClose,
  onTakePhoto,
  onPickImage,
}: SelectPhotoModalProps) {

  const { t, i18n } = useTranslation();

  const ModalContent = (
    <View style={Platform.OS === 'ios' ? styles.modalBoxIOS : styles.modalBoxAndroid}>
      <Text style={styles.modalTitle}>{t('lamduanflower.uploadPicture')}</Text>

      <TouchableOpacity
        style={styles.glassButton}
        onPress={() => {
          onTakePhoto()
          onClose()
        }}
      >
        <Camera size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>{t('lamduanflower.takePhoto')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.glassButton}
        onPress={() => {
          onPickImage()
          onClose()
        }}
      >
        <Gallery size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>{t('lamduanflower.chooseFormGallery')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelText}>{t('lamduanflower.cancel')}</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackground}>
          <TouchableWithoutFeedback onPress={() => {}}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="light" style={styles.blurWrapper}>
                {ModalContent}
              </BlurView>
            ) : (
              ModalContent
            )}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalBoxIOS: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: 300,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  modalBoxAndroid: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: 300,
    alignItems: 'center',
    backgroundColor: '#555555',
    borderRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 17,
    color: '#ffffffdd',
    marginBottom: 20,
    fontWeight: '500',
  },
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 30,
  },
  buttonText: {
    color: '#ffffffee',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    marginTop: 4,
    backgroundColor: '#e63946',
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
})

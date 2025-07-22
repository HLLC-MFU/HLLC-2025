import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View, Image, Text, TouchableOpacity } from "react-native";

interface TutorialModalProps {
  isVisible: boolean;
  onClose: () => void;
  photoUrl: string | null;
}

export default function TutorialModal({ isVisible, onClose, photoUrl }: TutorialModalProps) {
  const { t, i18n } = useTranslation();
  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackground} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={() => {}}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>{t('lamduanflower.noPicture')}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: "80%",
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 10,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 8,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "#eee",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#333",
  },
});

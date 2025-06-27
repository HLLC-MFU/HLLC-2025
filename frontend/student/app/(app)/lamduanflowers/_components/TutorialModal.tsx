import { Modal, Pressable, StyleSheet, View, Image } from "react-native";

interface TutorialModalProps {
  isVisible: boolean;
  onClose: () => void;
  photoUrl: string | null;
}

export function TutorialModal({ isVisible, onClose, photoUrl }: TutorialModalProps) {
  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={() => {}}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : null}
        </Pressable>
      </Pressable>
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
  modalContainer: {
    width: '80%',
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
});

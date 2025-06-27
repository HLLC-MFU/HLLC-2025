import { Modal, Pressable, StyleSheet, View } from "react-native";

interface TutorialModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export function TutorialModal({ isVisible, onClose }: TutorialModalProps) {
    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContainer} onPress={() => { }}>
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
        padding: 20,
        elevation: 10,
    },
});
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ConfirmModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  username?: string;
}

export function ConfirmModal({ isVisible, onCancel, onConfirm, username }: ConfirmModalProps) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.headerText}>Submit Confirmation</Text>
          <Text style={styles.bodyText}>
            Are you sure you want to submit
            {username ? ` as ${username}` : ''}?
          </Text>
          <Text style={styles.noteText}>This action cannot be undone.</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={onConfirm}>
              <Text style={styles.submitText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  submitButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  cancelText: {
    color: '#000',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

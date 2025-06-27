import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TutorialModal } from './TutorialModal';

export function MediaCard() {
  const [isModalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.youtubeBox}>
        <Text style={styles.title}>Video Youtube</Text>
      </View>

      <TouchableOpacity style={styles.modalButton} onPress={openModal}>
        <Text>Tutorial Modal</Text>
      </TouchableOpacity>

      <TutorialModal isVisible={isModalVisible} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  youtubeBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: 'center',
  },
});

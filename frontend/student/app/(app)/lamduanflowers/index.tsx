import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { TutorialModal } from './_components/TutorialModal';
import { ConfirmModal } from './_components/ConfirmModal';

const { width } = Dimensions.get('window');

export default function LamduanOrigamiPage() {
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isTutorialModalVisible, setTutorialModalVisible] = useState(false);
  const [username, setUsername] = useState('Waritpon');

  const handleConfirmSubmit = () => {
    setConfirmModalVisible(false);
  };

  const handleTurtorialModal = () => {
    setTutorialModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.box}>
          <Image
            source={{ uri: 'https://www.royalparkrajapruek.org/img/upload/20210309-6046ece04a35c.jpg' }}
            style={styles.bannerImage}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lamduan Origami</Text>
          <Text style={styles.cardText}>
            Enhance your knowledge of the university through the origami flower...
          </Text>

          <View style={styles.youtubeBox}>
            <Text>Video Youtube</Text>
          </View>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setTutorialModalVisible(true)}
          >
            <Text>Tutorial Modal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formBox}>
          <View style={styles.uploadBox}>
            <Text>Upload Picture</Text>
          </View>

          <TextInput
            placeholder="Type message..."
            placeholderTextColor="#000"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setConfirmModalVisible(true)}
          >
            <Text>Submit</Text>
          </TouchableOpacity>
        </View>

        <TutorialModal
          isVisible={isTutorialModalVisible}
          onClose={() => setTutorialModalVisible(false)}
        />

        <ConfirmModal
          isVisible={isConfirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          onConfirm={() => {
            setConfirmModalVisible(false);
          }}
          username={username}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  box: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    color: '#000',
    marginBottom: 12,
  },
  youtubeBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: 'center',
  },
  formBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  uploadBox: {
    height: 100,
    backgroundColor: '#ddd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  submitButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
});

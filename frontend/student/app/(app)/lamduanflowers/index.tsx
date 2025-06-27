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
  Platform,
} from 'react-native';

import { ConfirmModal } from './_components/ConfirmModal';
import { BannerImage } from './_components/BannerImage';
import { MediaCard } from './_components/MediaCard';

export default function LamduanOrigamiPage() {
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [username, setUsername] = useState('Waritpon');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <BannerImage />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lamduan Origami</Text>
          <Text style={styles.cardText}>
            Enhance your knowledge of the university through the origami flower. Additionally,
            immerse yourself in instructional origami videos that showcase the important information
            about the university.
          </Text>

          <MediaCard />
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

        <ConfirmModal
          isVisible={isConfirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          onConfirm={() => setConfirmModalVisible(false)}
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
  formBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
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

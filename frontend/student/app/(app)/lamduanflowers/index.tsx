import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function LamduanOrigamiPage() {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.box}>
        <Text>Picture Banner</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lamduan Origami</Text>
        <Text style={styles.cardText}>
          Enhance you knowledge of the university through the origami flower. Additionally,
          immerse yourself in instructional origami videos that showcase the important information
          about the university
        </Text>

        <View style={styles.youtubeBox}>
          <Text>Video Youtube</Text>
        </View>

        <TouchableOpacity style={styles.modalButton}>
          <Text>Tutorial Modal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formBox}>
        <View style={styles.uploadBox}>
          <Text>Upload Picture</Text>
        </View>

        <TextInput
          placeholder="Type message..."
          placeholderTextColor="#aaa"
          style={styles.input}
        />

        <TouchableOpacity style={styles.submitButton}>
          <Text>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
  },
  box: {
    height: 120,
    backgroundColor: '#eee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  card: {
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007bff',
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
    backgroundColor: '#fff',
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

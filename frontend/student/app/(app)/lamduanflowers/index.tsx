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
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { ConfirmModal } from './_components/ConfirmModal';
import { BannerImage } from './_components/BannerImage';
import { MediaCard } from './_components/MediaCard';

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 40;
const maxImageWidth = screenWidth - horizontalPadding;
const maxImageHeight = 400;

export default function LamduanOrigamiPage() {
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [message, setMessage] = useState('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setImageUri(uri);

      const getImageSize = (uri: string) =>
        new Promise<{ width: number; height: number }>((resolve, reject) => {
          Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error),
          );
        });

      try {
        const size = await getImageSize(uri);
        setImageSize(size);
      } catch (err) {
        console.warn('Failed to get image size:', err);
        setImageSize(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick an image. Please try again.');
      console.error('pickImage error:', error);
    }
  };


  return (
    <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <BannerImage />

        <BlurView intensity={40} tint="light" style={styles.card}>
          <Text style={styles.cardTitle}>Lamduan Origami</Text>
          <Text style={styles.cardText}>
            Enhance your knowledge of the university through the origami flower. Additionally,
            immerse yourself in instructional origami videos that showcase the important information
            about the university.
          </Text>
          <MediaCard />
        </BlurView>

        <BlurView intensity={40} tint="light" style={styles.formBox}>
          <TouchableOpacity onPress={pickImage}>
            {imageUri && imageSize ? (
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: maxImageWidth,
                  height: Math.min(
                    (imageSize.height / imageSize.width) * maxImageWidth,
                    maxImageHeight
                  ),
                  resizeMode: 'contain',
                  borderRadius: 12,
                  marginBottom: 12,
                  alignSelf: 'center',
                }}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadText}>Upload Picture</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Type message..."
            placeholderTextColor="#fff"
            style={styles.input}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setConfirmModalVisible(true)}
          >
            <Text>Submit</Text>
          </TouchableOpacity>
        </BlurView>

        <ConfirmModal
          isVisible={isConfirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          onConfirm={() => {
            setConfirmModalVisible(false);
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  cardText: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 12,
  },
  formBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    backgroundColor: '#eee',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 180,
    marginBottom: 12,
    width: 300,
    alignSelf: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#888',
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  submitButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#66aaf9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
});

import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
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
  Keyboard,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { ConfirmModal } from './_components/ConfirmModal';
import { BannerImage } from './_components/BannerImage';
import { MediaCard } from './_components/MediaCard';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import useProfile from '@/hooks/useProfile';
import { LamduanFlower } from '@/types/lamduan-flowers';
import { GlassButton } from '@/components/ui/GlassButton';

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 40;
const maxImageWidth = screenWidth - horizontalPadding;

export default function LamduanOrigamiPage() {
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [comment, setComment] = useState('');
  const { user } = useProfile();
  const { flowers, lamduanSetting, createLamduanFlowers, updateLamduanFlowers } = useLamduanFlowers();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const originalRef = useRef<LamduanFlower | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (!user?.data?.[0]?._id || !flowers?.length) return;

    const found = flowers.find(f => f.user._id === user.data[0]._id);
    if (found) {
      originalRef.current = found;
      setComment(found.comment);
      const photoUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${found.photo}`;
      setImageUri(photoUrl);

      getImageSize(photoUrl)
        .then(size => setImageSize(size))
        .catch(err => {
          console.warn('Failed to get image size:', err);
          setImageSize(null);
        });

      setHasSubmitted(true);
    }
  }, [flowers, user]);

  const handleSave = async (
    file: File,
    user: string,
    comment: string,
    setting: string,
  ) => {
    const original = originalRef.current;
    const formData = new FormData();

    if (file) {
      formData.append('photo', file);
    }
    formData.append('comment', comment.trim() === '' ? ' ' : comment);
    formData.append('user', user);
    formData.append('setting', setting);

    try {
      if (!original) {
        const res = await createLamduanFlowers(formData);
        if (res?.data && res.data._id) {
          originalRef.current = res.data;
          setHasSubmitted(true);
        }

        Alert.alert("Success", "Flower created successfully!");
      } else {
        await updateLamduanFlowers(original._id, formData);
        Alert.alert("Success", "Flower updated successfully!");
      }
    } catch (err) {
      console.error("submit error:", err);
      Alert.alert("Error", "Error submitting flower");
    }
  };

  const getImageSize = (uri: string) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error),
      );
    });

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

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setImageUri(uri);

      try {
        const size = await getImageSize(uri);
        setImageSize(size);
      } catch (err) {
        console.warn('Failed to get image size:', err);
        setImageSize(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take a photo. Please try again.');
      console.error('takePhoto error:', error);
    }
  };

  const handleUploadPress = () => {
    Alert.alert('Upload Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // const behavior = Platform.OS === 'ios' ? 'padding' : 'position';
  // const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20;

  // return (
  //   <SafeAreaView style={styles.safe}>
  //     <KeyboardAvoidingView
  //       style={{ flex: 1 }}
  //       behavior={behavior}
  //       keyboardVerticalOffset={keyboardVerticalOffset}
  //     ></KeyboardAvoidingView>

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          contentContainerStyle={[styles.container, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backButton}>
            <GlassButton onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back</Text>
            </GlassButton>
          </View>

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
            <Text style={styles.uploadTitle}>Upload Lamduan</Text>
            <TouchableOpacity onPress={handleUploadPress} style={styles.imageUploadButton}>
              {imageUri && imageSize ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    maxWidth: maxImageWidth,
                    height: undefined,
                    aspectRatio: imageSize.width / imageSize.height,
                    resizeMode: 'contain',
                    borderRadius: 12,
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
              ref={inputRef}
              placeholder="Type message..."
              placeholderTextColor="#fff"
              style={styles.input}
              value={comment}
              onChangeText={(text) => {
                if (text.length <= 144) {
                  setComment(text);
                } else {
                  setComment(text.slice(0, 144));
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY - 0, animated: true });
                  });
                }, 0);
              }}
              multiline
              textAlignVertical="top"
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 16,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13 }}>
                {comment.length} / 144
              </Text>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  if (!imageUri) {
                    Alert.alert('Error', 'Please select an image first.');
                    return;
                  }

                  const file = {
                    uri: imageUri,
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                  } as any;

                  if (hasSubmitted) {
                    await handleSave(file, user?.data[0]._id!, comment, lamduanSetting[0]._id);
                  } else {
                    setConfirmModalVisible(true);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {hasSubmitted ? 'Save' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <ConfirmModal
            isVisible={isConfirmModalVisible}
            onCancel={() => setConfirmModalVisible(false)}
            onConfirm={async () => {
              setConfirmModalVisible(false);

              if (!imageUri) {
                Alert.alert('Error', 'Please select an image first.');
                return;
              }
              try {
                const file = {
                  uri: imageUri,
                  name: 'photo.jpg',
                  type: 'image/jpeg',
                } as any;

                await handleSave(file, user?.data[0]._id!, comment, lamduanSetting[0]._id);

                setHasSubmitted(true);
              } catch (error) {
                console.error('Submit error:', error);
                Alert.alert('Error', 'Submission failed.');
              }
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
    paddingTop: 30,
  },
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
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
    paddingLeft: 10,
    color: '#fff',
  },
  cardText: {
    fontSize: 13,
    paddingLeft: 10,
    color: '#fff',
    marginBottom: 20,
    marginTop: 4,
  },
  uploadTitle: {
    fontWeight: 'bold',
    fontSize: 16,
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
  imageUploadButton: {
    marginBottom: 12,
  },
  uploadPlaceholder: {
    backgroundColor: '#eee',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 180,
    width: 300,
    alignSelf: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#888',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    fontSize: 14,
    color: '#e2e8f0',
  },
  submitButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#66aaf9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
});
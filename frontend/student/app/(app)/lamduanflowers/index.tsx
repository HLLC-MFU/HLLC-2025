import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  TextInput as RNTextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import ConfirmModal from './_components/ConfirmModal';
import BannerImage from './_components/BannerImage';
import MediaCard from './_components/MediaCard';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import useProfile from '@/hooks/useProfile';
import { LamduanFlower } from '@/types/lamduan-flowers';
import { GlassButton } from '@/components/ui/GlassButton';
import SelectPhotoModal from './_components/SelectPhotoModal';
import { useToastController } from '@tamagui/toast';
import StatusModal from './_components/StatusModal';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 40;
const maxImageWidth = screenWidth - horizontalPadding;

export default function LamduanOrigamiPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "th" | "en";
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [comment, setComment] = useState('');
  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const { user } = useProfile();
  const { flowers, lamduanSetting, createLamduanFlowers, updateLamduanFlowers } = useLamduanFlowers();
  const description = lamduanSetting[0]?.description?.[lang] ?? "";
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const originalRef = useRef<LamduanFlower | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<RNTextInput>(null);
  const toast = useToastController();
  const isFocused = useIsFocused();
  const [statusModalVisible, setStatusModalVisible] = useState(true);
  const [activityStatus, setActivityStatus] = useState<'not-started' | 'ended' | 'active'>('active');
  const isChanged = useMemo(() => {
    if (!hasSubmitted || !originalRef.current) return true;

    const origin = originalRef.current;
    const isCommentChanged = comment.trim() !== (origin.comment || '').trim();
    const isImageChanged = imageUri && !imageUri.includes(origin.photo);

    return isCommentChanged || isImageChanged;
  }, [comment, imageUri, hasSubmitted]);

  useEffect(() => {
    if (!user?.data?.[0]?._id || !flowers?.length) return;
    const found = flowers.find(f => f.user._id === user.data[0]._id);
    if (found) {
      originalRef.current = found;
      setComment(found.comment);
      const photoUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${found.photo}`;
      setImageUri(photoUrl);
      getImageSize(photoUrl).then(setImageSize).catch(() => setImageSize(null));
      setHasSubmitted(true);
    }
  }, [flowers, user]);

  useEffect(() => {
    if (lamduanSetting.length === 0 || !isFocused) return;

    const { startAt, endAt } = lamduanSetting[0];
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (now < start) {
      setActivityStatus('not-started');
      setStatusModalVisible(true);
    } else if (now > end) {
      setActivityStatus('ended');
      setStatusModalVisible(true);
    } else {
      setActivityStatus('active');
      setStatusModalVisible(false);
    }
  }, [lamduanSetting, isFocused]);


  const handleSave = async (file: File, user: string, comment: string, setting: string) => {
    const original = originalRef.current;
    const formData = new FormData();
    if (file) formData.append('photo', file);
    formData.append('comment', comment.trim() || ' ');
    formData.append('user', user);
    formData.append('setting', setting);

    try {
      if (!original) {
        const res = await createLamduanFlowers(formData);
        if (res?.data?._id) {
          originalRef.current = res.data;
          setHasSubmitted(true);
        }
        toast.show(t('lamduanflower.toast.createSuccess'), { message: t('lamduanflower.toast.submitSuccessfully'), type: 'success' });
      } else {
        await updateLamduanFlowers(original._id, formData);
        toast.show(t('lamduanflower.toast.updateSuccess'), { message: t('lamduanflower.toast.updatedSuccessfully'), type: 'success' });
      }
    } catch (err) {
      console.error('submit error:', err);
      toast.show(t('lamduanflower.toast.error'), { message: t('lamduanflower.toast.errorSubmit'), type: 'danger' });
    }
  };

  const getImageSize = (uri: string) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
    });

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission Denied', 'Allow access to photo library.');
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setImageUri(uri);
      getImageSize(uri).then(setImageSize).catch(() => setImageSize(null));
    } catch (err) {
      toast.show('Error', { message: 'Failed to pick image.', type: 'danger' });
      console.error('pickImage error:', err);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission Denied', 'Allow camera access.');
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setImageUri(uri);
      getImageSize(uri).then(setImageSize).catch(() => setImageSize(null));
    } catch (err) {
      toast.show('Error', { message: 'Failed to take photo.', type: 'danger' });
      console.error('takePhoto error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : -60} // ลด offset Android
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backButton}>
            <GlassButton onPress={() => router.back()}>
              <Text style={styles.backButtonText}>{t('lamduanflower.back')}</Text>
            </GlassButton>
          </View>

          <BannerImage />

          <BlurView intensity={40} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>{t('lamduanflower.title')}</Text>
            <Text style={styles.cardText}>
              {description}
            </Text>
            <MediaCard />
          </BlurView>

          <BlurView intensity={40} tint="light" style={styles.formBox}>
            <Text style={styles.uploadTitle}>{t('lamduanflower.uploadLamduan')}</Text>
            <TouchableOpacity
              onPress={() => {
                if (activityStatus !== 'active') {
                  setStatusModalVisible(true);
                } else {
                  setPhotoModalVisible(true);
                }
              }}
              style={styles.imageUploadButton}
            >
              {imageUri && imageSize ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    maxWidth: maxImageWidth,
                    aspectRatio: imageSize.width / imageSize.height,
                    resizeMode: 'contain',
                    borderRadius: 12,
                    alignSelf: 'center',
                  }}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadText}>{t('lamduanflower.uploadPicture')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              placeholder={t('lamduanflower.message')}
              placeholderTextColor="#fff"
              style={styles.input}
              value={comment}
              editable={activityStatus === 'active'}
              onChangeText={(text) => setComment(text.slice(0, 144))}
              onFocus={() => {
                if (activityStatus !== 'active') return;
                inputRef.current?.focus();
                setTimeout(() => {
                  scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
                    inputRef.current as any,
                    100,
                    true
                  );
                }, 100);
              }}
              multiline
              textAlignVertical="top"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>{comment.length} / 144</Text>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    opacity: (!imageUri || (hasSubmitted && !isChanged)) ? 0.4 : 1,
                  },
                ]}
                disabled={activityStatus !== 'active' || !imageUri || (hasSubmitted && !isChanged)}
                onPress={() => {
                  if (!imageUri) return Alert.alert('Error', 'Please select an image first.');
                  setConfirmModalVisible(true);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {hasSubmitted ? t('lamduanflower.save') : t('lamduanflower.submit')}
                </Text>
              </TouchableOpacity>

            </View>
          </BlurView>

          <ConfirmModal
            isVisible={isConfirmModalVisible}
            onCancel={() => setConfirmModalVisible(false)}
            onConfirm={async () => {
              setConfirmModalVisible(false);
              if (!imageUri) return Alert.alert('Error', 'Please select an image first.');
              try {
                const file = { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any;
                await handleSave(file, user?.data[0]._id!, comment, lamduanSetting[0]._id);
                setHasSubmitted(true);
              } catch (err) {
                console.error('Submit error:', err);
                Alert.alert('Error', 'Submission failed.');
              }
            }}
          />

          <SelectPhotoModal
            visible={isPhotoModalVisible}
            onClose={() => setPhotoModalVisible(false)}
            onTakePhoto={takePhoto}
            onPickImage={pickImage}
          />

          <StatusModal
            isVisible={statusModalVisible}
            onClose={() => setStatusModalVisible(false)}
            status={activityStatus}
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
    paddingTop: 30
  },
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff'
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 10,
    color: '#fff'
  },
  cardText: {
    fontSize: 13,
    paddingLeft: 10,
    color: '#fff',
    marginBottom: 20,
    marginTop: 4
  },
  uploadTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 12
  },
  formBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  imageUploadButton: {
    marginBottom: 20
  },
  uploadPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    height: 180,
    width: 300,
    alignSelf: 'center',
  },
  uploadText: { fontSize: 16, color: '#fff' },
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
    borderRadius: 30,
  },
});

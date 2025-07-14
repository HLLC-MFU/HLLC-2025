import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from 'react-native';

import { useLanguage } from '@/context/LanguageContext';
import { X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import chatService from '@/services/chats/chatService';
import { GlassButton } from '../ui/GlassButton';


interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface CreateRoomFormData {
  name: {
    thName: string;
    enName: string;
  };
  capacity: number;
  image?: string;
}

const CreateRoomModal = ({
  visible,
  onClose,
  onSuccess,
  userId,
}: CreateRoomModalProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: { thName: '', enName: '' },
    capacity: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const fileSize = asset.fileSize;
        if (typeof fileSize !== 'number') {
          Alert.alert(
            language === 'th' ? 'ไม่สามารถตรวจสอบขนาดไฟล์ได้' : 'Cannot check file size',
            language === 'th' ? 'กรุณาเลือกรูปภาพอื่น หรือถ่ายใหม่' : 'Please select another image or take a new one.'
          );
          return;
        }
        // ตรวจสอบขนาดไฟล์ (5MB = 5242880 bytes)
        if (fileSize > 5242880) {
          Alert.alert(
            language === 'th' ? 'ขนาดไฟล์ใหญ่เกินไป' : 'File too large',
            language === 'th' ? 'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB' : 'Please select an image smaller than 5MB'
          );
          return;
        }
        setSelectedImage(asset.uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

  const handleCreateRoom = async () => {
    try {
      if (!formData.name.thName || !formData.name.enName) {
        Alert.alert(
          'Error',
          'Please enter both Thai and English room names'
        );
        return;
      }

      if (!formData.capacity || formData.capacity < 2) {
        Alert.alert(
          'Error',
          'Room capacity must be at least 2'
        );
        return;
      }

      setLoading(true);
      setError(null);

      const result = await chatService.createRoom({
        name: {
          thName: formData.name.thName,
          enName: formData.name.enName,
        },
        capacity: formData.capacity,
        image: selectedImage || undefined,
        creatorId: ''
      });

      console.log(result)

      if (!result) {
        throw new Error('Failed to create room');
      }

      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create room'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: { thName: '', enName: '' },
      capacity: 10,
    });
    setError(null);
    setSelectedImage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.headerContainer}>
                <Text style={styles.modalTitle}>
                  {language === 'th' ? 'สร้างห้องแชทใหม่' : 'Create New Chat Room'}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.imageContainer} 
                onPress={pickImage}
                activeOpacity={0.85}
              >
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill}>
                  {/* Blur background for glass effect */}
                </BlurView>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.roomImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.cameraIconWrapper}>
                      <ImageIcon size={36} color="#fff" />
                    </View>
                    <Text style={styles.imagePlaceholderText}>
                      {language === 'th' ? 'เลือกรูปภาพห้อง' : 'Select Room Image'}
                    </Text>
                  </View>
                )}
                <View style={styles.imageOverlay} pointerEvents="none" />
              </TouchableOpacity>
              
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {language === 'th' ? 'ชื่อภาษาไทย' : 'Thai Name'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Room Name (Thai)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={formData.name.thName}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, thName: text }
                    }))}
                  />
                  <Text style={styles.charCount}>{formData.name.thName.length}/30</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {language === 'th' ? 'ชื่อภาษาอังกฤษ' : 'English Name'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Room Name (English)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={formData.name.enName}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, enName: text }
                    }))}
                  />
                  <Text style={styles.charCount}>{formData.name.enName.length}/30</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {language === 'th' ? 'จำนวนสมาชิกสูงสุด' : 'Capacity'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={language === 'th' ? 'จำนวนสมาชิกสูงสุด' : 'Maximum number of users'}
                    placeholderTextColor="#666"
                    value={formData.capacity.toString()}
                    onChangeText={(text) => {
                      let value = parseInt(text, 10);
                      if (isNaN(value) || value < 2) value = 2;
                      setFormData(prev => ({
                        ...prev,
                        capacity: value
                      }));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.helperText}>
                    {language === 'th' ? 'จำนวนสมาชิกต้องอยู่ระหว่าง 2-100 คน' : 'Capacity must be between 2-100 users'}
                  </Text>
                </View>
                
                {error && <Text style={styles.errorText}>{error}</Text>}
                
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={{ flex: 1, marginRight: 8 }} 
                    onPress={handleClose}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <GlassButton blurIntensity={18}>
                      <Text style={styles.buttonText}>
                        {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                      </Text>
                    </GlassButton>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{ flex: 1, marginLeft: 8 }}
                    onPress={handleCreateRoom}
                    disabled={loading || !formData.name.thName.trim() || !formData.name.enName.trim()}
                    activeOpacity={0.85}
                  >
                    <GlassButton blurIntensity={18}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {language === 'th' ? 'สร้างห้อง' : 'Create'}
                        </Text>
                      )}
                    </GlassButton>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: 340,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    maxHeight: '90%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  charCount: {
    fontSize: 12,
    color: '#fff',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2,
    borderColor: '#fff',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a5b4fc',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 18,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  cameraIconWrapper: {
    backgroundColor: '#ffffff70',
    borderRadius: 999,
    padding: 12,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#fff',
    marginTop: 2,
    fontSize: 15,
    textAlign: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    zIndex: 3,
  },
});

export default CreateRoomModal; 
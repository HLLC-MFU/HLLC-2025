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
} from 'react-native';
import { chatService, CreateRoomDto } from '../services/chatService';
import { useLanguage } from '@/context/LanguageContext';
import { X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
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
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.roomImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImageIcon size={32} color="#666" />
                  <Text style={styles.imagePlaceholderText}>
                    {language === 'th' ? 'เลือกรูปภาพห้อง' : 'Select Room Image'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
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
                style={[styles.button, styles.cancelButton]} 
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.createButton,
                  (!formData.name.thName.trim() || !formData.name.enName.trim()) && styles.disabledButton
                ]} 
                onPress={handleCreateRoom}
                disabled={loading || !formData.name.thName.trim() || !formData.name.enName.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {language === 'th' ? 'สร้างห้อง' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    padding: 14,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#2E7D32',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 16,
  },
});

export default CreateRoomModal; 
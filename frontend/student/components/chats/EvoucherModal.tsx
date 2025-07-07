import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Animated,
  TextInput,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { X, Gift, Send, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { apiRequest } from '@/utils/api';
import { getToken } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

interface EvoucherModalProps {
  roomId: string;
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EvoucherFormData {
  title: string;
  description: string;
  claimUrl: string;
}

const EvoucherModal = ({ roomId, isVisible, onClose, onSuccess }: EvoucherModalProps) => {
  const [formData, setFormData] = useState<EvoucherFormData>({
    title: '',
    description: '',
    claimUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<EvoucherFormData>>({});

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      // Open animation
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EvoucherFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกชื่อ evoucher';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกรายละเอียด evoucher';
    }

    if (!formData.claimUrl.trim()) {
      newErrors.claimUrl = 'กรุณากรอก URL สำหรับรับ evoucher';
    } else if (!isValidUrl(formData.claimUrl)) {
      newErrors.claimUrl = 'กรุณากรอก URL ที่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await getToken('accessToken');
      const response = await apiRequest('/api/evouchers/send', 'POST', {
        roomId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        claimUrl: formData.claimUrl.trim(),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        Alert.alert(
          'สำเร็จ',
          'ส่ง evoucher เรียบร้อยแล้ว',
          [
            {
              text: 'ตกลง',
              onPress: () => {
                onClose();
                onSuccess?.();
                // Reset form
                setFormData({
                  title: '',
                  description: '',
                  claimUrl: '',
                });
                setErrors({});
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการส่ง evoucher');
      }
    } catch (error) {
      console.error('Error sending evoucher:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่ง evoucher',
        [{ text: 'ตกลง' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
    // Reset form when closing
    setFormData({
      title: '',
      description: '',
      claimUrl: '',
    });
    setErrors({});
  };

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={handleClose} delayPressIn={0} delayPressOut={0}>
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: overlayOpacity,
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {}} delayPressIn={0} delayPressOut={0}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: contentScale }
                ]
              }
            ]}
          >
            <BlurView intensity={40} tint="dark" style={styles.modalBackground} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <Gift size={24} color="#fff" />
                <Text style={styles.modalTitle}>ส่ง E-Voucher</Text>
              </View>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={loading}
              >
                <View style={styles.closeButtonInner}>
                  <X color="#fff" size={20} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.contentContainer}>
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                  <AlertCircle size={20} color="#0A84FF" />
                  <Text style={styles.infoText}>
                    ส่ง E-Voucher ให้กับสมาชิกในห้องนี้
                  </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                  {/* Title Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>ชื่อ E-Voucher *</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        errors.title && styles.textInputError
                      ]}
                      placeholder="เช่น ส่วนลด 50% สำหรับร้านอาหาร"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={formData.title}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, title: text }));
                        if (errors.title) {
                          setErrors(prev => ({ ...prev, title: undefined }));
                        }
                      }}
                      editable={!loading}
                    />
                    {errors.title && (
                      <Text style={styles.errorText}>{errors.title}</Text>
                    )}
                  </View>

                  {/* Description Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>รายละเอียด *</Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        errors.description && styles.textInputError
                      ]}
                      placeholder="อธิบายรายละเอียดของ E-Voucher"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={formData.description}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, description: text }));
                        if (errors.description) {
                          setErrors(prev => ({ ...prev, description: undefined }));
                        }
                      }}
                      multiline
                      numberOfLines={3}
                      editable={!loading}
                    />
                    {errors.description && (
                      <Text style={styles.errorText}>{errors.description}</Text>
                    )}
                  </View>

                  {/* Claim URL Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>URL สำหรับรับ E-Voucher *</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        errors.claimUrl && styles.textInputError
                      ]}
                      placeholder="https://example.com/claim"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={formData.claimUrl}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, claimUrl: text }));
                        if (errors.claimUrl) {
                          setErrors(prev => ({ ...prev, claimUrl: undefined }));
                        }
                      }}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {errors.claimUrl && (
                      <Text style={styles.errorText}>{errors.claimUrl}</Text>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, loading && styles.disabledButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>กำลังส่ง...</Text>
                ) : (
                  <>
                    <Send size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>ส่ง E-Voucher</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: height * 0.8,
    width: width * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  
  closeButton: {
    padding: 4,
  },
  
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  contentContainer: {
    padding: 20,
  },
  
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  
  formContainer: {
    gap: 20,
  },
  
  fieldContainer: {
    gap: 8,
  },
  
  fieldLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  textInputError: {
    borderColor: '#FF453A',
  },
  
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    marginTop: 4,
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  submitButton: {
    flex: 2,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EvoucherModal; 
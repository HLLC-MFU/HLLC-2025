import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, Keyboard, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AlertTriangle } from 'lucide-react-native';
import { useToastController } from '@tamagui/toast';

import DropDownPicker from 'react-native-dropdown-picker';
import { useReport } from '@/hooks/useReport';
import { BlurView } from 'expo-blur';
import { Background } from '@react-navigation/elements';

interface ReportType {
  _id: string;
  name: {
    th: string;
    en: string;
  };
}

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isLargeTablet = screenWidth >= 1024;

export const ReportModal = ({ visible, onClose, onSuccess, onError }:ReportModalProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [description, setDescription] = useState('');
  const toast = useToastController();
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState<{label: string, value: string}[]>([]);
  const { topics, loading, error, fetching, fetchReportTypes, submitReport } = useReport();

  const DESCRIPTION_LIMIT = 300;

  useEffect(() => {
    if (visible) {
      setSelectedTopic(''); // reset ทุกครั้งที่เปิด modal
      fetchReportTypes();
    }
  }, [visible]);

  useEffect(() => {
    if (topics.length > 0) {
      const items = [{ label: 'เลือกหัวข้อ', value: '' }, ...topics.map((t: ReportType) => ({ label: t.name.th, value: t._id }))];
      setDropdownItems(items);
    }
  }, [topics]);

  const handleSubmit = async () => {
    if (!selectedTopic || !description.trim()) return;
    
    const success = await submitReport(selectedTopic, description);
    
    if (success) {
      setDescription('');
      setSelectedTopic('');
      onClose();
      toast.show('ส่งรายงานสำเร็จ', { type: 'success' });
      onSuccess && onSuccess();
    } else {
      toast.show(error || 'ส่งรายงานไม่สำเร็จ', { type: 'error' });
      onError && onError();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.overlay}>
        <View style={styles.iconWrap}>
            <AlertTriangle color="#FF3333" size={64}  />
          </View>
          <BlurView intensity={40} tint="light" style={styles.glassContainer}>
            <Text style={styles.title}>Report</Text>
            <Text style={styles.label}>Topic</Text>
            <DropDownPicker
              open={open}
              value={selectedTopic}
              items={dropdownItems}
              setOpen={setOpen}
              setValue={setSelectedTopic}
              setItems={setDropdownItems}
              placeholder="เลือกหัวข้อ"
              style={styles.dropdownPicker}
              dropDownContainerStyle={styles.dropdownPickerContainer}
              textStyle={styles.dropdownPickerText}
              placeholderStyle={styles.dropdownPickerPlaceholder}
              zIndex={1000}
              zIndexInverse={1000}
              disabled={fetching}
            />
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                style={styles.textArea}
                placeholder="Description"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={text => {
                  if (text.length <= DESCRIPTION_LIMIT) setDescription(text);
                }}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                blurOnSubmit={true}
                maxLength={DESCRIPTION_LIMIT}
              />
              <Text style={styles.charCount}>{description.length}/{DESCRIPTION_LIMIT}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selectedTopic || !description.trim() || loading}
                style={[styles.confirmBtn, { opacity: (!selectedTopic || !description.trim() || loading) ? 0.5 : 1 }]}
              >
                <Text style={styles.confirmBtnText}>{loading ? '...' : 'CONFIRM'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: isTablet ? screenHeight * 0.25 : 230,
    zIndex: 2,
    borderRadius: isTablet ? 50 : 40,
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  glassContainer: {
    width: isTablet ? '70%' : '90%',
    maxWidth: isLargeTablet ? 600 : undefined,
    borderRadius: isTablet ? 32 : 24,
    padding: isTablet ? 32 : 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    overflow: 'hidden',
    paddingTop: isTablet ? 72 : 56,
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: isTablet ? 16 : 12,
    marginTop: 4,
  },
  label: {
    alignSelf: 'flex-start',
    color: '#444',
    fontSize: isTablet ? 18 : 16,
    marginTop: isTablet ? 12 : 8,
    marginBottom: 2,
    fontWeight: '600',
  },
  pickerWrap: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    height: isTablet ? 52 : 44,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: isTablet ? 52 : 44,
    color: '#222',
    fontSize: isTablet ? 18 : 16,
    marginTop: -2,
    marginBottom: -2,
    paddingVertical: 0,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  textAreaWrap: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  textArea: {
    width: '100%',
    minHeight: isTablet ? 120 : 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: isTablet ? 16 : 12,
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    right: isTablet ? 16 : 12,
    bottom: isTablet ? 12 : 8,
    color: '#aaa',
    fontSize: isTablet ? 14 : 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: isTablet ? 16 : 12,
    gap: isTablet ? 16 : 12,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 12 : 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelBtnText:{
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  confirmBtn: {
    backgroundColor: 'rgba(30,144,255,0.7)',
    borderRadius: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  confirmBtnText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dropdown: {
    width: '100%',
    marginBottom: 16,
  },
  dropdownSelect: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: isTablet ? 52 : 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#222',
    fontSize: isTablet ? 18 : 16,
  },
  dropdownOptionText: {
    color: '#222',
    fontSize: isTablet ? 18 : 16,
  },
  dropdownPicker: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    height: isTablet ? 52 : 44,
    marginBottom: 16,
    paddingHorizontal: isTablet ? 16 : 12,
    zIndex: 1000,
  },
  dropdownPickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 1000,
  },
  dropdownPickerText: {
    color: '#222',
    fontSize: isTablet ? 18 : 16,
  },
  dropdownPickerPlaceholder: {
    color: '#888',
    fontSize: isTablet ? 18 : 16,
  },
}); 
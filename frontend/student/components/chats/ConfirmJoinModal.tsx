import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChatRoom } from '@/types/chatTypes';
import { GlassButton } from '../ui/GlassButton';

interface ConfirmJoinModalProps {
  visible: boolean;
  room: ChatRoom | null;
  language: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmJoinModal = ({ visible, room, language, onConfirm, onCancel }: ConfirmJoinModalProps) => {
  if (!room) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill}>
        <View style={styles.centered}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>
              {language === 'th' ? 'ยืนยันการเข้าร่วมห้อง' : 'Confirm Join Room'}
            </Text>
            <Text style={styles.roomName}>
              {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onCancel} style={{ flex: 1, marginRight: 8 }}>
                <GlassButton blurIntensity={18}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </Text>
                </GlassButton>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex: 1, marginLeft: 8 }}>
                <GlassButton blurIntensity={18}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                    {language === 'th' ? 'เข้าร่วม' : 'Join'}
                  </Text>
                </GlassButton>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  roomName: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 18,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
});

export default ConfirmJoinModal; 
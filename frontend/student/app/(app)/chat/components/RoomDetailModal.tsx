import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassButton } from '../../../../components/ui/GlassButton';
import { ChatRoom } from '../types/chatTypes';
import { API_BASE_URL } from '../config/chatConfig';
import { chatService } from '../services/chatService';

interface RoomDetailModalProps {
  visible: boolean;
  room: ChatRoom | null;
  language: string;
  onClose: () => void;
}

interface Member {
  user_id: string;
  user: {
    name: {
      first: string;
      middle: string;
      last: string;
    };
  };
}

export const RoomDetailModal = ({ visible, room, language, onClose }: RoomDetailModalProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && room?.id) {
      setLoading(true);
      chatService.getRoomMembers(room.id)
        .then(res => setMembers(res?.members || []))
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [visible, room?.id]);

  if (!room) return null;
  const imageUrl = room.image_url || room.image ? `${API_BASE_URL}/uploads/rooms/${room.image_url || room.image}` : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill}>
        <View style={styles.centered}>
          <View style={styles.modalContent}>
            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <Text style={styles.roomName}>
              {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
            </Text>
            {room.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{room.category}</Text>
              </View>
            )}

            <Text style={[styles.roomName, { fontSize: 15, marginTop: 16, marginBottom: 4 }]}>สมาชิกในห้อง ({members.length})</Text>
            <View style={{ maxHeight: 120, width: '100%' }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ScrollView style={{ maxHeight: 120 }}>
                  {members.length === 0 ? (
                    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>ไม่มีสมาชิก</Text>
                  ) : (
                    members.map((m) => (
                      <Text key={m.user_id} style={{ color: '#fff', fontSize: 14, marginBottom: 2 }}>
                        {m.user.name.first} {m.user.name.middle} {m.user.name.last}
                      </Text>
                    ))
                  )}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ marginTop: 16 }}>
              <GlassButton blurIntensity={20}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </GlassButton>
            </TouchableOpacity>
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
    width: 320,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  image: {
    width: 120,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#dff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  detailText: {
    color: '#e0e7ff',
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
}); 
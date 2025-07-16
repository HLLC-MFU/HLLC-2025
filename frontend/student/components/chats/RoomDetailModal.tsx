import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChatRoom } from '@/types/chatTypes';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { GlassButton } from '../ui/GlassButton';
import chatService from '@/services/chats/chatService';

interface RoomDetailModalProps {
  visible: boolean;
  room: ChatRoom | null;
  language: string;
  onClose: () => void;
}

interface Member {
  user_id: string;
  username: string;
}

export const RoomDetailModal = ({ visible, room, language, onClose }: RoomDetailModalProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && room?.id) {
      setLoading(true);
      chatService.getRoomMembers(room.id)
        .then((res: any) => {
          const rawMembers = res?.data?.members || [];
          const safeMembers = rawMembers.map((m: any) => ({
            user_id: m.user_id || m.user?._id || '',
            username: m.user?.username || '',
          }));
          setMembers(safeMembers);
        })
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [visible, room?.id]);

  if (!room) return null;
  const imageUrl = room.image_url || room.image ? `${CHAT_BASE_URL}/api/uploads/${room.image_url || room.image}` : null;

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
                <ScrollView style={{ maxHeight: 120 }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
                  {members.length === 0 ? (
                    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>ไม่มีสมาชิก</Text>
                  ) : (
                    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      {members.slice(0, 5).map((m) => (
                        <Text key={m.user_id} style={{ color: '#fff', fontSize: 14, marginBottom: 2, textAlign: 'center' }}>
                          {m.username || m.user_id}
                        </Text>
                      ))}
                      {members.length > 5 && (
                        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 2, textAlign: 'center' }}>...</Text>
                      )}
                    </View>
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
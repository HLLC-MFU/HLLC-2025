import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Users, Clock } from 'lucide-react-native';
import { ChatRoom } from '@/types/chatTypes';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';


interface RoomListItemProps {
  room: ChatRoom;
  language: string;
  onPress: () => void;
  index: number;
  width: number;
}

const RoomListItem = ({ room, language, onPress, width }: RoomListItemProps) => {
  const avatarChar = (language === 'th' ? room.name?.th : room.name?.en)?.charAt(0)?.toUpperCase() || '?';
  let imageUrl = room.image_url || room.image ;
  if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
    imageUrl = `${CHAT_BASE_URL}/uploads/${imageUrl}`;
  }
  return (
    <TouchableOpacity style={[styles.item, { width: (width - 52) / 2 }]} onPress={() => { console.log('RoomListItem pressed', room.id); onPress(); }} activeOpacity={0.85}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{avatarChar}</Text>
          )}
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.roomName} numberOfLines={1} ellipsizeMode="tail">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={13} color="#ffffff70" />
            <Text style={styles.metaText}>{room.members_count ?? 0} Members</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color="#ffffff70" />
            <Text style={styles.metaText}>1h ago</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minHeight: 80,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#6366f1',
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#ffffff70',
    marginLeft: 2,
  },
});

export default RoomListItem; 
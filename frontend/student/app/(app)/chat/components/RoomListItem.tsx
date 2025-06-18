import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Clock } from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';

interface RoomListItemProps {
  room: ChatRoom;
  language: string;
  onPress: () => void;
  index: number;
  width: number;
}

const RoomListItem = ({ room, language, onPress, width }: RoomListItemProps) => {
  // ใช้ตัวอักษรแรกของชื่อห้องเป็น avatar
  const avatarChar = (language === 'th' ? room.name?.th : room.name?.en)?.charAt(0)?.toUpperCase() || '?';
  return (
    <TouchableOpacity style={[styles.item, { width: (width - 52) / 2 }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{avatarChar}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.roomName} numberOfLines={1} ellipsizeMode="tail">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </Text>
        {room.category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{room.category}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={13} color="#6366f1" />
            <Text style={styles.metaText}>{room.members_count ?? 0} Members</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color="#a5b4fc" />
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#22223b',
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
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
    color: '#6366f1',
    marginLeft: 2,
  },
});

export default RoomListItem; 
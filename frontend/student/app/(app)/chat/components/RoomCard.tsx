import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Users } from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';
import { BlurView } from 'expo-blur';

interface RoomCardProps {
  room: ChatRoom;
  width: number;
  language: string;
  onPress: () => void;
  onJoin?: () => void;
  index: number;
}

const RoomCard = ({ room, width, language, onPress, onJoin }: RoomCardProps) => {
  const imageUrl = room.image_url || room.image || undefined;
  return (
    <TouchableOpacity style={[styles.card, { width: (width - 52) / 2 }]} onPress={onPress} activeOpacity={0.88}>
      <BlurView intensity={30} tint="light" style={styles.cardBlur}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
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
          <View style={styles.memberRow}>
            <Users size={14} color="#6366f1" />
            <Text style={styles.memberText}>{room.members_count ?? 0} Members</Text>
          </View>
          {onJoin && (
            <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.85}>
              <Text style={styles.joinBtnText}>{language === 'th' ? 'เข้าร่วม' : 'Join'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    marginBottom: 12,
    marginRight: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flex: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.7,
    backgroundColor: '#e0e7ff',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e7ff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  infoContainer: {
    padding: 12,
    gap: 6,
  },
  roomName: {
    fontSize: 15,
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
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  memberText: {
    fontSize: 12,
    color: '#6366f1',
    marginLeft: 2,
  },
  joinBtn: {
    marginTop: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default RoomCard;
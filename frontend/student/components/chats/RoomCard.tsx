import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { ChatRoom } from '@/types/chatTypes';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { GlassButton } from '../ui/GlassButton';

interface RoomCardProps {
  room: ChatRoom;
  width: number;
  language: string;
  onPress: () => void;
  onJoin?: () => void;
  onShowDetail?: () => void;
  index: number;
}

const RoomCard = ({ room, width, language, onPress, onJoin, onShowDetail }: RoomCardProps) => {
  const getImageUrl = () => {
    if (room.image) return `${CHAT_BASE_URL}/uploads/${room.image}`;
    return undefined;
  };

  const imageUrl = getImageUrl();
  const memberCount = room?.members_count  ;

  return (
    <TouchableOpacity style={[, { width: (width - 66) / 2 }]} onPress={onShowDetail ? onShowDetail : onPress} activeOpacity={0.88}>
      <BlurView intensity={50} tint="light" style={styles.cardBlur}>
        <View style={styles.gradientOverlay} pointerEvents="none" />
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
            <Users size={14} color="#fff" />
            <Text style={styles.memberText}>{memberCount} Members</Text>
          </View>
          {onJoin && (
            <TouchableOpacity onPress={onJoin} activeOpacity={0.85} style={styles.joinBtn}>
              <GlassButton blurIntensity={20}>
                <Text style={styles.joinBtnText}>{language === 'th' ? 'เข้าร่วม' : 'Join'}</Text>
              </GlassButton>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

  cardBlur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    zIndex: 1,
    backgroundColor: 'transparent',
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
    color: '#ffffff',
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dff',
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
    color: '#fff',
    marginLeft: 2,
  },
  joinBtn: {
    marginTop: 6,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default RoomCard;
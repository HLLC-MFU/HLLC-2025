import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Users } from 'lucide-react-native';
import { ChatRoom } from '../types/chatTypes';
import { BlurView } from 'expo-blur';
import { API_BASE_URL } from '../config/chatConfig';
import { GlassButton } from '../../../../components/ui/GlassButton';

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
    const url = room.image_url || room.image;
      return `${API_BASE_URL}/uploads/rooms/${url}`;
  };

  const imageUrl = getImageUrl();

  return (
    <TouchableOpacity style={[styles.card, { width: (width - 66) / 2 }]} onPress={onShowDetail ? onShowDetail : onPress} activeOpacity={0.88}>
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
            <Text style={styles.memberText}>{room.members_count ?? 0} Members</Text>
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    zIndex: 1,
    backgroundColor: 'transparent',
    // Gradient overlay (simulate with linear-gradient if using expo-linear-gradient)
    // If not, fallback to semi-transparent white
    // background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
    // React Native doesn't support gradients in View, so use expo-linear-gradient if needed
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
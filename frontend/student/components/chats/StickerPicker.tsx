import { CHAT_BASE_URL, API_BASE_URL } from '@/configs/chats/chatConfig';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';


interface Sticker {
  id: string;
  name: {
    th: string;
    en: string;
  };
  image: string;
}

interface StickerPickerProps {
  onSelectSticker: (stickerId: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async () => {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/api/stickers`);
      if (!response.ok) {
        throw new Error('Failed to fetch stickers');
      }
      const data = await response.json();
      setStickers(data.data);
    } catch (err) {
      console.error('Error fetching stickers:', err);
      setError('Failed to load stickers');
    } finally {
      setLoading(false);
    }
  };

  const getStickerImageUrl = (imagePath: string) => {
    // If imagePath is already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, construct the full URL
    const fullUrl = `${CHAT_BASE_URL}/uploads/${imagePath}`;
    return fullUrl;
  };

  if (loading) {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStickers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <BlurView intensity={40} tint="dark" style={styles.glassContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Stickers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer} activeOpacity={0.7}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={stickers}
            numColumns={4}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.stickerItem,
                  pressedIndex === index && styles.stickerItemPressed,
                ]}
                onPress={() => onSelectSticker(item.id)}
                onPressIn={() => setPressedIndex(index)}
                onPressOut={() => setPressedIndex(null)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getStickerImageUrl(item.image) }}
                  style={styles.stickerImage}
                  resizeMode="contain"
                />
                <Text style={styles.stickerName} numberOfLines={1}>
                  {item.name.th}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.stickerGrid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  glassContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: 420,
  },
  innerContainer: {
    padding: 16,
    backgroundColor: 'rgba(24,26,32,0.35)', // semi-transparent overlay for glass effect
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButtonContainer: {
    backgroundColor: '#232A34',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  closeButton: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  stickerGrid: {
    paddingBottom: 16,
  },
  stickerItem: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(35,42,52,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(42,42,42,0.25)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stickerItemPressed: {
    backgroundColor: 'rgba(10,132,255,0.18)',
    borderColor: '#0A84FF',
  },
  stickerImage: {
    width: '80%',
    height: '65%',
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#1A1A1A',
  },
  stickerName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.92,
    letterSpacing: 0.1,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
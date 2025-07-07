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
    const fullUrl = `${API_BASE_URL}/uploads/${imagePath}`;
    return fullUrl;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStickers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stickers</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={stickers}
        numColumns={4}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stickerItem}
            onPress={() => onSelectSticker(item.id)}
            activeOpacity={0.7}
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    padding: 16,
    maxHeight: 400,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  stickerImage: {
    width: '85%',
    height: '70%',
    borderRadius: 8,
  },
  stickerName: {
    color: '#fff',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
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
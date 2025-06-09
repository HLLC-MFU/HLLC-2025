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
import { API_BASE_URL } from '../config/chatConfig';

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
      console.log('Fetching stickers from:', `${API_BASE_URL}/stickers`);
      const response = await fetch(`${API_BASE_URL}/stickers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stickers: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Sticker response data:', JSON.stringify(data, null, 2));
      if (!data.stickers || !Array.isArray(data.stickers)) {
        throw new Error('Invalid sticker data format');
      }
      
      // Transform sticker data to include full image URLs
      const transformedStickers = data.stickers.map((sticker: Sticker) => ({
        ...sticker,
        image: `${API_BASE_URL}/stickers/${sticker.image}`
      }));
      
      setStickers(transformedStickers);
    } catch (err) {
      console.error('Error fetching stickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stickers');
    } finally {
      setLoading(false);
    }
  };

  const handleStickerSelect = (stickerId: string) => {
    console.log('Selected sticker:', stickerId);
    onSelectSticker(stickerId);
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
        <Text style={styles.title}>สติกเกอร์ ({stickers.length})</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>ปิด</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={stickers}
        numColumns={4}
        renderItem={({ item }) => {
          console.log('Rendering sticker:', item.id, item.image);
          return (
            <TouchableOpacity
              style={styles.stickerItem}
              onPress={() => handleStickerSelect(item.id)}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.stickerImage}
                resizeMode="contain"
                onError={(e) => {
                  console.error('Error loading sticker image:', e.nativeEvent.error);
                  // Try to reload the image with a different URL format if it fails
                  const fallbackUrl = `${API_BASE_URL}/stickers/images/${item.image}`;
                  console.log('Trying fallback URL:', fallbackUrl);
                  // Force image reload with fallback URL
                  Image.prefetch(fallbackUrl).catch(err => 
                    console.error('Fallback image load failed:', err)
                  );
                }}
              />
              <Text style={styles.stickerName} numberOfLines={1}>
                {item.name.th}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.stickerGrid}
        ListEmptyComponent={
          <Text style={styles.errorText}>ไม่มีสติกเกอร์</Text>
        }
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
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#0A84FF',
    fontSize: 16,
  },
  stickerGrid: {
    paddingBottom: 16,
  },
  stickerItem: {
    flex: 1,
    aspectRatio: 1,
    padding: 8,
    alignItems: 'center',
  },
  stickerImage: {
    width: '100%',
    height: '80%',
  },
  stickerName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 
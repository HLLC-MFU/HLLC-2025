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
      const response = await fetch(`${API_BASE_URL}/stickers`);
      if (!response.ok) {
        throw new Error('Failed to fetch stickers');
      }
      const data = await response.json();
      console.log('Sticker response:', data);
      setStickers(data.stickers);
    } catch (err) {
      console.error('Error fetching stickers:', err);
      setError('Failed to load stickers');
    } finally {
      setLoading(false);
    }
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
          >
            <Image
              source={{ uri: item.image }}
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
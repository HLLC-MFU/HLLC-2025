import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { chatService, ChatRoom } from './services/chatService';
import { useLanguage } from '@/context/LanguageContext';

function ChatPage() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRooms = await chatService.getRooms();
      console.log('Fetched rooms:', fetchedRooms);
      setRooms(fetchedRooms);
    } catch (err) {
      setError('Failed to load chat rooms');
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRooms}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.back()}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HLLC Community</Text>
          <TouchableOpacity>
            <Search color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Chat Rooms Grid */}
        <ScrollView 
          style={styles.roomsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.roomsGrid}>
            {rooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No chat rooms available</Text>
              </View>
            ) : (
              rooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, { width: (width - 48) / 2 }]}
                  onPress={() => router.push({
                    pathname: "/chat/[roomId]",
                    params: { roomId: room.id }
                  })}
                >
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>
                      {language === 'th' ? room.name.th_name : room.name.en_name}
                    </Text>
                    <View style={styles.roomStats}>
                      <Users size={14} color="#666" />
                      <Text style={styles.roomMembers}>{room.connected_users} / {room.capacity}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  navItem: {
    padding: 8,
  },
  roomsContainer: {
    flex: 1,
    padding: 16,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  roomCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 16,
  },
  roomImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  roomInfo: {
    gap: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  roomDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    height: 32,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomMembers: {
    fontSize: 12,
    color: '#666',
  },
});

export default ChatPage;
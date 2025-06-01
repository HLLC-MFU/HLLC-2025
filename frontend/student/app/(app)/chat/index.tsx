import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { chatService } from './services/chatService';
import { ChatRoom } from './types/chatTypes';
import { useLanguage } from '@/context/LanguageContext';
import CreateRoomModal from './components/CreateRoomModal';
import useProfile from '@/hooks/useProfile';
import useAuth from '@/hooks/useAuth';
import { getToken } from '@/utils/storage';

// Components
import RoomCard from './components/RoomCard';
import RoomListItem from './components/RoomListItem';
import FloatingActionButton from './components/FloatingActionButton';
import LoadingSpinner from './components/LoadingSpinner';
import CustomTabBar from './components/CustomTabBar';

export default function ChatPage() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const { user } = useProfile();
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const userId = user?._id || '';

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const tabBarAnimation = useRef(new Animated.Value(1)).current;
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'my' ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true
    }).start();
  }, [activeTab]);

  useEffect(() => {
    console.log('User state changed:', { userId, user });
  }, [userId, user]);

  const loadRooms = useCallback(async () => {
    console.log('Starting loadRooms...', { userId });
    try {
      if (!userId) {
        console.log('No userId available, skipping room load');
        setRooms([]);
        return;
      }
      setLoading(true);
      setError(null);

      console.time('loadRooms');
      console.time('getRooms');
      const allRooms = await chatService.getRooms();
      console.timeEnd('getRooms');
      console.log('Fetched rooms:', allRooms);

      console.time('getToken');
      const token = await getToken('accessToken');
      console.timeEnd('getToken');

      console.time('processRooms');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      console.log('Payload:', payload);
      const currentUserId = payload?.sub;
      console.log('Current user ID:', currentUserId);

      if (!currentUserId) {
        throw new Error('Could not get user ID from token');
      }

      // Get rooms with members
      const roomsWithMembers = await chatService.getRoomsWithMembers();
      console.log('Member rooms:', JSON.stringify(roomsWithMembers, null, 2));

      // Create a map of room IDs to their members
      const roomMembersMap = new Map<string, string[]>();
      roomsWithMembers.rooms.forEach(({ room, members }) => {
        console.log('Room:', JSON.stringify(room, null, 2));
        roomMembersMap.set(room.id, members);
      });

      // Set is_member based on whether the current user is in the members array
      const enrichedRooms = allRooms.map(room => {
        console.log('Processing room:', JSON.stringify(room, null, 2));
        const roomData = {
          ...room,
          is_member: roomMembersMap.get(room.id)?.includes(currentUserId) || false,
        };
        console.log('Processed room data:', JSON.stringify(roomData, null, 2));
        return roomData;
      });

      console.timeEnd('processRooms');
      console.log('Processed rooms:', enrichedRooms);

      setRooms(enrichedRooms);
      console.timeEnd('loadRooms');
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log('loadRooms effect triggered', { userId });
    if (userId) {
      loadRooms();
    }
  }, [loadRooms, userId]);

  const myRooms = useMemo(() => rooms.filter(r => r.is_member), [rooms]);
  const discoverRooms = useMemo(() => rooms.filter(r => !r.is_member), [rooms]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        // Navigate to room and connect WebSocket
        router.push({
          pathname: "/chat/[roomId]",
          params: { 
            roomId: roomId,
            room: JSON.stringify(result.room),
            isMember: 'true'
          }
        });
        loadRooms(); // Refresh room list
      } else {
        throw new Error(result.message || 'Failed to join room');
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      setError(language === 'th' ? 'ไม่สามารถเข้าร่วมห้องแชทได้' : 'Failed to join room');
    }
  }, [router, loadRooms, language]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  const navigateToRoom = useCallback(async (rid: string, isMember: boolean) => {
    try {
      if (isMember) {
        router.push({
          pathname: "/chat/[roomId]",
          params: { 
            roomId: rid,
            isMember: 'true'
          }
        });
      } else {
        const result = await chatService.joinRoom(rid);
        
        if (result.success && result.room) {
          router.push({
            pathname: "/chat/[roomId]",
            params: { 
              roomId: rid,
              isMember: 'true'
            }
          });
          loadRooms();
        } else {
          Alert.alert(
            language === 'th' ? 'ไม่สามารถเข้าร่วมห้อง' : 'Cannot Join Room',
            result.message || (language === 'th' ? 'ไม่สามารถเข้าร่วมห้องได้' : 'Failed to join room'),
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error navigating to room:', error);
      Alert.alert(
        language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
        language === 'th' ? 'ไม่สามารถเข้าห้องแชทได้' : 'Cannot access chat room',
        [{ text: 'OK' }]
      );
    }
  }, [router, loadRooms, language]);

  const renderEmptyState = useCallback((message: string) => {
    const EmptyStateIcon = activeTab === 'my' ? MessageCircle : Sparkles;
    
    return (
      <Animated.View 
        style={[
          styles.emptyState,
          { transform: [{ scale: tabBarAnimation }] }
        ]}
      >
        <View style={styles.emptyIconContainer}>
          <EmptyStateIcon size={32} color="#555" style={styles.emptyIcon} />
        </View>
        <Text style={styles.emptyStateText}>
          {language === 'th' ? 
            (activeTab === 'my' ? 'คุณยังไม่ได้เข้าร่วมห้องแชทใดๆ' : 'ไม่พบห้องแชทใหม่') : 
            message}
        </Text>
        {activeTab === 'my' && (
          <TouchableOpacity 
            style={styles.emptyActionButton} 
            onPress={() => setActiveTab('discover')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyActionText}>
              {language === 'th' ? 'ค้นหาห้องแชท' : 'Discover Rooms'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }, [language, activeTab, tabBarAnimation]);

  const renderMyRoomItem = useCallback(({ item, index }: { item: ChatRoom, index: number }) => (
    <RoomListItem 
      room={item} 
      language={language} 
      onPress={() => navigateToRoom(item.id, true)} 
      index={index}
    />
  ), [language, navigateToRoom]);

  const renderDiscoverRoomItem = useCallback(({ item, index }: { item: ChatRoom, index: number }) => (
    <RoomCard 
      room={item} 
      width={width} 
      language={language} 
      onPress={() => navigateToRoom(item.id, false)} 
      index={index}
    />
  ), [width, language, navigateToRoom]);

  const keyExtractor = useCallback((item: ChatRoom) => item.id, []);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50],
    extrapolate: 'clamp'
  });
  
  const tabBarOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp'
  });

  const flatListProps = {
    initialNumToRender: 8,
    maxToRenderPerBatch: 5,
    windowSize: 5,
    removeClippedSubviews: true,
    showsVerticalScrollIndicator: false,
    onEndReachedThreshold: 0.5,
    refreshControl: (
      <RefreshControl 
        refreshing={refreshing} 
        onRefresh={handleRefresh} 
        colors={['#4CAF50']} 
        tintColor="#4CAF50" 
        progressBackgroundColor="#1A1A1A"
      />
    ),
  };

  if (loading && !refreshing) return (
    <View style={[styles.container, styles.centerContent]}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <LoadingSpinner text={language === 'th' ? 'กำลังโหลดห้องแชท...' : 'Loading chat rooms...'} />
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={loadRooms}
        activeOpacity={0.7}
      >
        <Text style={styles.retryText}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" translucent />
        <SafeAreaView style={styles.safeArea}>
          <CustomTabBar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            language={language}
            tabBarOpacity={tabBarOpacity}
            tabBarAnimation={tabBarAnimation}
            tabIndicatorPosition={tabIndicatorPosition}
          />
          <View style={[styles.roomsContainer, styles.centerContent]}>
            <Text style={styles.errorText}>{language === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadRooms}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <FloatingActionButton onPress={() => setCreateModalVisible(true)} />
        <CreateRoomModal 
          visible={createModalVisible} 
          onClose={() => setCreateModalVisible(false)} 
          onSuccess={loadRooms} 
          userId={userId} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" translucent />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.headerContainer,
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity
            }
          ]}
        >
          <CustomTabBar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            language={language}
            tabBarOpacity={tabBarOpacity}
            tabBarAnimation={tabBarAnimation}
            tabIndicatorPosition={tabIndicatorPosition}
          />
        </Animated.View>

        <View style={styles.roomsContainer}>
          {activeTab === 'my' && (
            myRooms.length === 0 ? renderEmptyState('No chat rooms joined') : (
              <Animated.FlatList
                key="myRoomsList"
                data={myRooms}
                renderItem={renderMyRoomItem}
                keyExtractor={keyExtractor}
                {...flatListProps}
                contentContainerStyle={styles.listContent}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
              />
            )
          )}
          
          {activeTab === 'discover' && (
            discoverRooms.length === 0 ? renderEmptyState('No new rooms to discover') : (
              <Animated.FlatList
                key="discoverRoomsList"
                data={discoverRooms}
                renderItem={renderDiscoverRoomItem}
                keyExtractor={keyExtractor}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                {...flatListProps}
                contentContainerStyle={styles.gridContent}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
              />
            )
          )}
        </View>
      </SafeAreaView>
      
      <FloatingActionButton onPress={() => setCreateModalVisible(true)} />
      
      <CreateRoomModal 
        visible={createModalVisible} 
        onClose={() => setCreateModalVisible(false)} 
        onSuccess={loadRooms} 
        userId={userId} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    backgroundColor: '#444',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    opacity: 0.7,
  },
  emptyStateText: {
    color: '#AAA',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 0.3,
  },
  emptyActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    zIndex: 10,
  },
  roomsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  gridContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
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
  const userId = user?.id || '';
  
  // Animation refs
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
  
  const loadRooms = useCallback(async () => {
    try {
      if (!userId) {
        setRooms([]);
        return;
      }
      setLoading(true);
      setError(null);

      const allRooms = await chatService.getRooms();
      console.log('Fetched rooms:', allRooms);
      setRooms(allRooms);
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
    if (userId) {
      loadRooms();
    }
  }, [loadRooms, userId]);
  
  const handleRefresh = useCallback(() => { 
    Animated.sequence([
      Animated.timing(tabBarAnimation, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(tabBarAnimation, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
    
    setRefreshing(true); 
    loadRooms(); 
  }, [loadRooms]);

  const myRooms = useMemo(() => (rooms || []).filter(r => r.is_member), [rooms]);
  const discoverRooms = useMemo(() => (rooms || []).filter(r => !r.is_member), [rooms]);

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
          pathname: `/chat/${roomId}`,
          params: { 
            room: JSON.stringify(result.room),
            isMember: true
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

  const navigateToRoom = useCallback((rid: string, isMember: boolean) => {
    if (isMember) {
      router.push(`/chat/${rid}`);
    } else {
      joinRoom(rid);
    }
  }, [router, joinRoom]);

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

  if (loading && !refreshing) return (
    <View style={[styles.container, styles.centerContent]}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <LoadingSpinner text={language === 'th' ? 'กำลังโหลดห้องแชท...' : 'Loading chat rooms...'} />
    </View>
  );

  if (error && !refreshing) return (
    <View style={[styles.container, styles.centerContent]}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.errorText}>{language === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={loadRooms}
        activeOpacity={0.7}
      >
        <Text style={styles.retryText}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

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
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={handleRefresh} 
                    colors={['#4CAF50']} 
                    tintColor="#4CAF50" 
                    progressBackgroundColor="#1A1A1A"
                  />
                }
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={handleRefresh} 
                    colors={['#4CAF50']} 
                    tintColor="#4CAF50" 
                    progressBackgroundColor="#1A1A1A"
                  />
                }
                initialNumToRender={8}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
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
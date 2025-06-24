import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import useProfile from '@/hooks/useProfile';
import { useChatRooms } from '../../../hooks/chats/useChatRooms';
import { useChatAnimations } from '../../../hooks/chats/useChatAnimations';
import { ChatRoom } from '../../../types/chatTypes';
import { BlurView } from 'expo-blur';
import CategoryFilter from '@/components/chats/CategoryFilter';
import ChatHeader from '@/components/chats/ChatHeader';
import { ChatTabBar } from '@/components/chats/ChatTabBar';
import { ConfirmJoinModal } from '@/components/chats/ConfirmJoinModal';
import CreateRoomModal from '@/components/chats/CreateRoomModal';
import LoadingSpinner from '@/components/chats/LoadingSpinner';
import RoomCard from '@/components/chats/RoomCard';
import { RoomDetailModal } from '@/components/chats/RoomDetailModal';
import RoomListItem from '@/components/chats/RoomListItem';
import chatService from '@/services/chats/chatService';
import { t, getLocalizedField } from '@/utils/i18n';

export default function ChatPage() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const { language } = useLanguage();
  const { user } = useProfile();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [confirmJoinVisible, setConfirmJoinVisible] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoom | null>(null);
  const userId = user?.data?.[0]?._id || '';

  const {
    rooms,
    loading,
    refreshing,
    error,
    activeTab,
    selectedCategory,
    filteredRooms,
    setActiveTab,
    setSelectedCategory,
    loadRooms,
    setRefreshing,
  } = useChatRooms();

  const {
    scrollY,
    headerScale,
    tabBarAnimation,
    fabScale,
    shimmerAnim,
    pulseAnim,
    animateFab,
    animateTabBar,
  } = useChatAnimations();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const joinRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    setPendingJoinRoom(room || null);
    setConfirmJoinVisible(true);
  };

  const handleConfirmJoin = async () => {
    if (!pendingJoinRoom) return;
    setConfirmJoinVisible(false);
    try {
      const result = await chatService.joinRoom(pendingJoinRoom.id);
      if (result.success) {
        router.push({
          pathname: "/chat/[roomId]",
          params: { roomId: pendingJoinRoom.id, isMember: 'true' }
        });
      } else {
        Alert.alert(
          t('joinFailed', language),
          result.message || t('joinFailedMessage', language)
        );
      }
    } catch (error) {
      Alert.alert(
        t('error', language),
        t('cannotJoin', language)
      );
    }
  };

  const navigateToRoom = async (rid: string, isMember: boolean) => {
    try {
      if (isMember) {
        router.push({
          pathname: "/chat/[roomId]",
          params: { roomId: rid, isMember: 'true' }
        });
      } else {
        await joinRoom(rid);
      }
    } catch (error) {
      console.error('Error navigating to room:', error);
      Alert.alert(
        t('error', language),
        t('cannotAccess', language)
      );
    }
  };

  const handleTabChange = (tab: 'my' | 'discover') => {
    animateTabBar();
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    loadRooms();
  };

  const renderRoomItem = ({ item, index }: { item: ChatRoom; index: number }) => {
    if (activeTab === 'my') {
      return (
        <RoomListItem 
          room={item}
          language={language}
          onPress={() => navigateToRoom(item.id, true)}
          index={index} width={0}
        />
      );
    }
    // สำหรับ discovery: กด card ให้แสดงรายละเอียดห้อง (modal)
    const showRoomDetail = () => {
      setSelectedRoom(item);
      setDetailModalVisible(true);
    };
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
      >
        <BlurView
          intensity={30}
          tint="light"
          style={styles.cardBlur}
        >
          <RoomCard 
            room={item}
            width={width}
            language={language}
            onJoin={() => joinRoom(item.id)}
            onShowDetail={showRoomDetail}
            index={index} 
            onPress={() => {}} // ไม่ต้องใช้งานจริงใน discover
          />
        </BlurView>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <LoadingSpinner text={t('loadingCommunities', language)} />
        </View>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <ChatHeader
          language={language}
          roomsCount={rooms.length}
          joinedRoomsCount={rooms.filter(r => r.is_member).length}
          headerScale={headerScale}
          pulseAnim={pulseAnim}
          headerOpacity={headerOpacity}
        />
        <ChatTabBar
          language={language}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabBarAnimation={tabBarAnimation}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <FlatList
          data={filteredRooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id}
          numColumns={activeTab === 'discover' ? 2 : 1}
          key={`${activeTab}-${selectedCategory}`}
          contentContainerStyle={[
            styles.listContent,
            activeTab === 'discover' ? styles.gridContent : styles.listContentSingle
          ]}
          columnWrapperStyle={activeTab === 'discover' ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#fff']}
              tintColor="#fff"
              progressBackgroundColor="#ffffff"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Sparkles size={48} color="#a5b4fc" />
              <Text style={styles.emptyStateText}>
                {t('noCommunities', language)}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>

        <TouchableOpacity
          style={styles.enhancedFab}
          onPress={() => {
            animateFab();
            setCreateModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <BlurView intensity={0} tint="light" style={styles.fabGradient}>
            <Plus size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        {/* ปุ่มไปหน้า step-counter */}
        <TouchableOpacity
          style={styles.stepCounterFab}
          onPress={() => router.push('/step-counter')}
          activeOpacity={0.9}
        >
          <View style={styles.stepCounterFabInner}>
            <Text style={styles.stepCounterFabText}>Step</Text>
          </View>
        </TouchableOpacity>

      <CreateRoomModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadRooms}
        userId={userId}
      />

      <RoomDetailModal
        visible={detailModalVisible}
        room={selectedRoom}
        language={language}
        onClose={() => setDetailModalVisible(false)}
      />

      <ConfirmJoinModal
        visible={confirmJoinVisible}
        room={pendingJoinRoom}
        language={language}
        onConfirm={handleConfirmJoin}
        onCancel={() => setConfirmJoinVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    flexGrow: 1,
    minHeight: '1%',
    alignContent: 'center'
  },
  listContentSingle: {
    gap: 12,
  },
  gridContent: {
    gap: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  enhancedFab: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    marginBottom: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.18)',
    flex: 1,
  },
  stepCounterFab: {
    position: 'absolute',
    bottom: 190,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCounterFabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCounterFabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
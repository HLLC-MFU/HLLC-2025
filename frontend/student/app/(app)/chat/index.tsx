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
import RoomCard from '@/components/chats/RoomCard';
import { RoomDetailModal } from '@/components/chats/RoomDetailModal';
import RoomListItem from '@/components/chats/RoomListItem';
import chatService from '@/services/chats/chatService';
import { useTranslation } from 'react-i18next';
import { Easing } from 'react-native';
import { AlignJustify } from '@tamagui/lucide-icons';

interface ChatRoomWithId extends ChatRoom {
  _id?: string;
}

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
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const coinAnim = useState(new Animated.Value(0))[0];
  const stepAnim = useState(new Animated.Value(0))[0];
  const createAnim = useState(new Animated.Value(0))[0];

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.stagger(50, [
      Animated.timing(coinAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(stepAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(createAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.stagger(50, [
      Animated.timing(createAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.exp),
      }),
      Animated.timing(stepAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.exp),
      }),
      Animated.timing(coinAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.exp),
      }),
    ]).start(() => setIsMenuOpen(false));
  };
  const toggleMenu = () => {
    if (isMenuOpen) closeMenu();
    else openMenu();
  };

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
    pulseAnim,
    animateTabBar,
  } = useChatAnimations();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const joinRoom = async (roomId: string) => {
    if (!roomId) {
      return;
    }
    const room = (rooms as ChatRoomWithId[]).find(r => r.id === roomId || r._id === roomId);
    setPendingJoinRoom(room || null);
    setConfirmJoinVisible(true);
  };

  const handleConfirmJoin = async () => {
    const pendingRoom = pendingJoinRoom as ChatRoomWithId | null;
    const roomId = (pendingRoom?.id || pendingRoom?._id) ?? null;
    if (!pendingRoom || !roomId) {
      console.error('No valid room to join');
      return;
    }
    setConfirmJoinVisible(false);
    try {
      const result = await chatService.joinRoom(roomId);
      if (result.success) {
        router.push({
          pathname: "/chat/[roomId]",
          params: { roomId, isMember: 'true' }
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
    console.log('navigateToRoom', rid, isMember);
    try {
      if (isMember) {
        const room = rooms.find(r => r.id === rid);
        router.push({
          pathname: "/chat/[roomId]",
          params: { roomId: rid, isMember: 'true', room: JSON.stringify(room) }
        });
      } else {
        await joinRoom(rid);
      }
    } catch (error) {
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

  // ปรับปรุง handleRefresh ให้เหมาะสมกับ refreshControl
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRooms(); 
    } finally {
      setRefreshing(false); 
    }
  };

  const renderRoomItem = ({ item, index }: { item: ChatRoomWithId; index: number }) => {
    // log item
    const roomId = item.id || item._id; // รองรับทั้งสองแบบ
    if (activeTab === 'my') {
      return (
        <RoomListItem 
          room={item}
          language={language}
          onPress={() => navigateToRoom(roomId as string, true)}
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
            onJoin={() => joinRoom(String(item.id || item._id))}
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
        <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#fff']}
              tintColor="#fff"
              progressBackgroundColor="#ffffff"
            />
        </View>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  // ก่อน View Gooey FAB Menu
  const subFabs = [
    {
      key: 'create',
      icon: <Plus size={24} color="#fff" />,
      label: null,
      anim: createAnim,
      onPress: () => { closeMenu(); setCreateModalVisible(true); },
    },
    {
      key: 'step',
      icon: null,
      label: 'Step',
      anim: stepAnim,
      onPress: () => { closeMenu(); router.replace('/community/step-counter'); },
    },
    {
      key: 'coin',
      icon: null,
      label: 'Coin',
      anim: coinAnim,
      onPress: () => { closeMenu(); router.replace('/coin-hunting'); },
    },
  ];

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
          data={filteredRooms as ChatRoomWithId[]}
          renderItem={renderRoomItem}
          keyExtractor={(item: ChatRoomWithId, index) => (item.id || item._id) ? String(item.id || item._id) : `room-${index}`}
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

        {/* Gooey FAB Menu */}
        <View style={{ position: 'absolute', bottom: 10, right: 0, alignItems: 'flex-end', justifyContent: 'flex-end', width: 80, height: 300 }} pointerEvents="box-none">
          {/* BlurView background overlay */}
          {isMenuOpen && (
            <BlurView
              intensity={30}
              tint="dark"
              style={{
                position: 'absolute',
                top: -1000,
                left: -1000,
                width: 3000,
                height: 3000,
                zIndex: 1,
              }}
              pointerEvents="auto"
            >
              <TouchableOpacity
                style={{ flex: 1, width: '100%', height: '100%' }}
                activeOpacity={1}
                onPress={closeMenu}
              />
            </BlurView>
          )}
          {/* Sub-FABs (dynamic, vertical up from main FAB) */}
          {subFabs.map((fab, idx) => (
            <Animated.View
              key={fab.key}
              pointerEvents={isMenuOpen ? 'auto' : 'none'}
              style={[
                styles.fabSubButton,
                {
                  position: 'absolute',
                  right: 24 ,
                  bottom: 70 * (4.75 - idx), // 70, 140, 210 ...
                  zIndex: 2,
                  opacity: fab.anim,
                  transform: [
                    { translateY: fab.anim.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) },
                    { scale: fab.anim },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabSubButtonInner}
                onPress={fab.onPress}
                activeOpacity={0.9}
              >
                {fab.icon ? fab.icon : <Text style={styles.stepCounterFabText}>{fab.label}</Text>}
              </TouchableOpacity>
            </Animated.View>
          ))}
          {/* Main FAB */}
          <View style={{ zIndex: 3 }}>
            <TouchableOpacity
              style={styles.enhancedFab}
              onPress={toggleMenu}
              activeOpacity={0.9}
            >
              <BlurView intensity={0} tint="light" style={styles.fabGradient}>
                <AlignJustify size={24} color="#fff" style={{ transform: [{ rotate: isMenuOpen ? '45deg' : '0deg' }] }} />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

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
  coinHuntingFab:{
    position: 'absolute',
    bottom: 260,
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
  fabSubButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  fabSubButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
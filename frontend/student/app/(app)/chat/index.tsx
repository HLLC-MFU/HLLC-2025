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
import { useChatRooms } from './hooks/useChatRooms';
import { useChatAnimations } from './hooks/useChatAnimations';
import { ChatRoom } from './types/chatTypes';
import CreateRoomModal from './components/CreateRoomModal';
import RoomCard from './components/RoomCard';
import RoomListItem from './components/RoomListItem';
import LoadingSpinner from './components/LoadingSpinner';
import { ChatHeader } from './components/ChatHeader';
import { ChatTabBar } from './components/ChatTabBar';
import { CategoryFilter } from './components/CategoryFilter';
import { BlurView } from 'expo-blur';

export default function ChatPage() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const { language } = useLanguage();
  const { user } = useProfile();
  const [createModalVisible, setCreateModalVisible] = useState(false);
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
    try {
      animateTabBar();
      router.push({
        pathname: "/chat/[roomId]",
        params: { roomId, isMember: 'true' }
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      Alert.alert(
        language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
        language === 'th' ? 'ไม่สามารถเข้าร่วมห้องแชทได้' : 'Failed to join room'
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
        language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
        language === 'th' ? 'ไม่สามารถเข้าห้องแชทได้' : 'Cannot access chat room'
      );
    }
  };

  const renderRoomItem = ({ item, index }: { item: ChatRoom; index: number }) => {
    if (activeTab === 'my') {
      return (
        <RoomListItem 
          room={item} 
          language={language} 
          onPress={() => navigateToRoom(item.id, true)} 
          index={index}
        />
      );
    }
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToRoom(item.id, false)}
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
            index={index} onPress={function (): void {
              throw new Error('Function not implemented.');
            } }          />
        </BlurView>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <LoadingSpinner text={language === 'th' ? 'กำลังโหลดชุมชน...' : 'Loading communities...'} />
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
          onTabChange={setActiveTab}
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
              onRefresh={() => setRefreshing(true)}
              colors={['#6366f1']}
              tintColor="#6366f1"
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
                {language === 'th' ? 'ไม่พบชุมชนในหมวดหมู่นี้' : 'No communities found in this category'}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.enhancedFab}
          onPress={() => {
            animateFab();
            setCreateModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <View style={styles.fabGradient}>
            <Plus size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

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
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    right: 24,
  },
  enhancedFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    bottom: 60,
    backgroundColor: '#6366f1',
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    marginBottom: 12,
    marginRight: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flex: 1,
  },
});
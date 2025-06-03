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
import { Sparkles, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
      <RoomCard 
        room={item} 
        width={width} 
        language={language} 
        onPress={() => navigateToRoom(item.id, false)} 
        onJoin={() => joinRoom(item.id)}
        index={index}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#e0e7ff', '#f8fafc']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#e0e7ff" translucent />
        <View style={styles.loadingContainer}>
          <LoadingSpinner text={language === 'th' ? 'กำลังโหลดชุมชน...' : 'Loading communities...'} />
        </View>
      </LinearGradient>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  return (
    <LinearGradient colors={['#e0e7ff', '#f8fafc']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e0e7ff" translucent />
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
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.fabGradient}>
            <Zap size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <CreateRoomModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadRooms}
        userId={userId}
      />
    </LinearGradient>
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
    color: '#64748b',
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
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
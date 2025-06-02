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
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap, 
  Heart,
  Star,
  Crown,
  Globe,
  Coffee,
  Music,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { chatService } from './services/chatService';
import { ChatRoom } from './types/chatTypes';
import { useLanguage } from '@/context/LanguageContext';
import CreateRoomModal from './components/CreateRoomModal';
import useProfile from '@/hooks/useProfile';
import useAuth from '@/hooks/useAuth';
import { getToken } from '@/utils/storage';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced Components
import RoomCard from './components/RoomCard';
import RoomListItem from './components/RoomListItem';
import FloatingActionButton from './components/FloatingActionButton';
import LoadingSpinner from './components/LoadingSpinner';

export default function ChatPage() {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const { user } = useProfile();
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('discover');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const userId = user?.data?.[0]?._id || '';

  // Enhanced Animation Values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const tabBarAnimation = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Enhanced Categories with Icons
  const Categories = [
    { name: 'All', icon: Globe, color: '#6366f1' },
    { name: 'Tech', icon: Zap, color: '#3b82f6' },
    { name: 'Art', icon: Heart, color: '#ec4899' },
    { name: 'Music', icon: Music, color: '#8b5cf6' },
    { name: 'Sports', icon: TrendingUp, color: '#10b981' },
    { name: 'Movies', icon: Star, color: '#f59e0b' },
    { name: 'Coffee', icon: Coffee, color: '#92400e' },
    { name: 'Crypto', icon: Crown, color: '#dc2626' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Continuous animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Enhanced room loading with mock data for demo
  const loadRooms = useCallback(async () => {
    console.log('Starting loadRooms...', { userId });
    try {
      setLoading(true);
      setError(null);
      const allRooms = await chatService.getRooms();
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
    loadRooms();
  }, [loadRooms]);

  const myRooms = useMemo(() => rooms.filter(r => r.is_member), [rooms]);
  const discoverRooms = useMemo(() => rooms.filter(r => !r.is_member), [rooms]);

  const filteredRooms = useMemo(() => {
    const baseRooms = activeTab === 'my' ? myRooms : discoverRooms;
    return baseRooms.filter(room => {
      const matchesCategory = selectedCategory === 'All' || (room as any).category === selectedCategory;
      return matchesCategory;
    });
  }, [activeTab, myRooms, discoverRooms, selectedCategory]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      // Enhanced join animation
      Animated.sequence([
        Animated.timing(tabBarAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(tabBarAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Mock successful join
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, is_member: true } : room
      ));
      
      router.push({
        pathname: "/chat/[roomId]",
        params: { roomId, isMember: 'true' }
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      setError(language === 'th' ? 'ไม่สามารถเข้าร่วมห้องแชทได้' : 'Failed to join room');
    }
  }, [router, language]);

  const navigateToRoom = useCallback(async (rid: string, isMember: boolean) => {
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
        language === 'th' ? 'ไม่สามารถเข้าห้องแชทได้' : 'Cannot access chat room',
        [{ text: 'OK' }]
      );
    }
  }, [router, joinRoom, language]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  // Enhanced Header Component
  const renderEnhancedHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.9],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View style={[styles.enhancedHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(99,102,241,0.1)', 'transparent']}
          style={styles.headerGradient}
        />
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>
                {language === 'th' ? 'สวัสดี!' : 'Welcome!'}
              </Text>
              <Animated.Text style={[styles.headerTitle, { transform: [{ scale: headerScale }] }]}>
                {language === 'th' ? 'ชุมชนของเรา' : 'Our Community'}
              </Animated.Text>
            </View>
          </View>

          {/* Enhanced Stats */}
          <View style={styles.statsContainer}>
            <Animated.View style={[styles.statItem, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.statIconContainer}>
                <Users size={16} color="#6366f1" />
              </View>
              <Text style={styles.statNumber}>{rooms.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'th' ? 'ห้อง' : 'Rooms'}
              </Text>
            </Animated.View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MessageCircle size={16} color="#10b981" />
              </View>
              <Text style={styles.statNumber}>{myRooms.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'th' ? 'เข้าร่วม' : 'Joined'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Enhanced Tab Bar
  const renderEnhancedTabBar = () => (
    <Animated.View style={[styles.enhancedTabBar, { transform: [{ scale: tabBarAnimation }] }]}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabBarContainer}>
          {[
            { key: 'discover', label: language === 'th' ? 'ค้นพบ' : 'Discover', icon: Sparkles },
            { key: 'my', label: language === 'th' ? 'ของฉัน' : 'My Rooms', icon: MessageCircle }
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabButton,
                activeTab === key && styles.tabButtonActive
              ]}
              onPress={() => setActiveTab(key as 'my' | 'discover')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={activeTab === key ? ['#6366f1', '#8b5cf6'] : ['transparent', 'transparent']}
                style={styles.tabButtonGradient}
              >
                <Icon size={18} color={activeTab === key ? '#fff' : '#64748b'} />
                <Text style={[
                  styles.tabButtonText,
                  activeTab === key && styles.tabButtonTextActive
                ]}>
                  {label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Enhanced Category Filter
  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {Categories.map(({ name, icon: Icon, color }) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.categoryFilterButton,
              selectedCategory === name && styles.categoryFilterButtonActive,
              { borderColor: color }
            ]}
            onPress={() => setSelectedCategory(name)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedCategory === name ? [color, `${color}dd`] : ['#ffffff', '#f8fafc']}
              style={styles.categoryFilterGradient}
            >
              <Icon size={16} color={selectedCategory === name ? '#fff' : color} />
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === name && styles.categoryFilterTextActive
              ]}>
                {name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Enhanced Room Item
  const renderRoomItem = useCallback(({ item, index }: { item: ChatRoom, index: number }) => {
    if (activeTab === 'my') {
      return (
        <RoomListItem 
          room={item} 
          language={language} 
          onPress={() => navigateToRoom(item.id, true)} 
          index={index}
        />
      );
    } else {
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
    }
  }, [activeTab, language, navigateToRoom, joinRoom, width]);

  // Loading State
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

  return (
    <LinearGradient
      colors={['#e0e7ff', '#f8fafc']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#e0e7ff" translucent />
      <SafeAreaView style={styles.safeArea}>
        {renderEnhancedHeader()}
        {renderEnhancedTabBar()}
        {renderCategoryFilter()}
        
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

      {/* Enhanced FAB */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.enhancedFab}
          onPress={() => {
            Animated.sequence([
              Animated.timing(fabScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
              Animated.timing(fabScale, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            setCreateModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.fabGradient}
          >
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
  
  // Enhanced Header Styles
  enhancedHeader: {
    paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  searchButton: {
    // Keep or remove depending on desired UI - current UI uses input directly
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginHorizontal: 20, // Add horizontal margin to align with other sections
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Enhanced Tab Bar
  enhancedTabBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tabBarGradient: {
    padding: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButtonActive: {},
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },

  // Category Filter
  categoryFilterContainer: {
    marginBottom: 20,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryFilterButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  categoryFilterButtonActive: {},
  categoryFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },

  // List Styles
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

  // Empty State
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

  // Enhanced FAB
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
    bottom:60,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
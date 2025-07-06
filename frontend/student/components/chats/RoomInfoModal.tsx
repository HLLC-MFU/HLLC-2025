import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Animated,
  FlatList,
  Dimensions
} from 'react-native';
import { X, Users, Clock, Shield, Star } from 'lucide-react-native';

import Avatar from './Avatar';
import { RoomInfoModalProps } from '@/types/chatTypes';
import { formatTime } from '@/utils/chats/timeUtils';


const { width, height } = Dimensions.get('window');

const RoomInfoModal = ({ room, isVisible, onClose, connectedUsers }: RoomInfoModalProps) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      // Open animation
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible || !room) return null;

  const occupancyPercentage = (connectedUsers.length / room.capacity) * 100;

  // Header component
  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Room Title */}
      <View style={styles.roomTitleContainer}>
        <Text style={styles.roomInfoTitle}>
          {room.name?.th || room.name?.en || 'Unnamed Room'}
        </Text>

      </View>
      
      {room.description && (
        <Text style={styles.roomDescription}>{room.description}</Text>
      )}
      
      {/* Room Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Occupancy Card */}
        <View style={styles.statCard}>
          <Users size={20} color="#fff" />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {connectedUsers.length}/{room.capacity || 0}
            </Text>
            <Text style={styles.statLabel}>ผู้ใช้งาน</Text>
            <View style={styles.occupancyBar}>
              <View 
                style={[
                  styles.occupancyFill, 
                  { width: `${Math.min(occupancyPercentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        
        {/* Created Date Card */}
        <View style={styles.statCard}>
          <Clock size={20} color="#fff" />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {room.created_at ? formatTime(room.created_at) : 'Unknown'}
            </Text>
            <Text style={styles.statLabel}>สร้างเมื่อ</Text>
          </View>
        </View>
      </View>
      
      {/* Security Badge */}
      <View style={styles.securityBadge}>
        <Shield size={16} color="#fff" />
        <Text style={styles.securityText}>ห้องแชทปลอดภัย</Text>
      </View>
      
      {/* Users Section Title */}
      <View style={styles.usersSectionHeader}>
        <Text style={styles.connectedUsersTitle}>
          ผู้ใช้ที่กำลังออนไลน์ ({connectedUsers.length})
        </Text>
      </View>
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.noUsersContainer}>
      <Users size={48} color="#fff" />
      <Text style={styles.noUsersText}>ไม่มีผู้ใช้ออนไลน์</Text>
      <Text style={styles.noUsersSubtext}>
        รอให้เพื่อนเข้าร่วมห้องแชท
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={onClose} delayPressIn={0} delayPressOut={0}>
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: overlayOpacity,
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {}} delayPressIn={0} delayPressOut={0}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: contentScale }
                ]
              }
            ]}
          >
            {/* Glass background */}
            <View style={styles.modalBackground} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดห้องแชท</Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.closeButtonInner}>
                  <X color="#fff" size={20} />
                </View>
              </TouchableOpacity>
            </View>
            
            <FlatList 
              style={styles.scrollContainer}
              data={connectedUsers}
              keyExtractor={(item) => item.id.toString()}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmptyState}
              renderItem={({ item: user }) => (
                <View style={styles.connectedUser}>
                  <Avatar 
                    name={user.name || user.id || 'Unknown User'} 
                    online={true} 
                    size={42} 
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.connectedUserName}>
                      {user.name || user.id || 'Unknown User'}
                    </Text>
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>ออนไลน์</Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={styles.userActionButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.userActionText}>@</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              scrollEventThrottle={16}
              removeClippedSubviews={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
    paddingVertical: 40,
    pointerEvents: 'auto',
  },
  
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: height * 0.7,
    width: width * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 500,
    maxWidth: width * 0.95,
    pointerEvents: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: -1,
    pointerEvents: 'none',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    height: 70,
    pointerEvents: 'auto',
  },
  
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    pointerEvents: 'none',
  },
  
  closeButton: {
    padding: 4,
    pointerEvents: 'auto',
  },
  
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    pointerEvents: 'none',
  },
  
  scrollContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: height * 0.5,
    pointerEvents: 'auto',
  },
  
  headerSection: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    pointerEvents: 'none',
  },
  
  roomTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    pointerEvents: 'none',
  },
  
  roomInfoTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.5,
    pointerEvents: 'none',
  },
  
  roomBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  roomDescription: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    pointerEvents: 'none',
  },
  
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    pointerEvents: 'none',
  },
  
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'none',
  },
  
  statContent: {
    marginTop: 8,
    pointerEvents: 'none',
  },
  
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    pointerEvents: 'none',
  },
  
  statLabel: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
    pointerEvents: 'none',
  },
  
  occupancyBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  
  occupancyFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    pointerEvents: 'none',
  },
  
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    pointerEvents: 'none',
  },
  
  securityText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    pointerEvents: 'none',
  },
  
  usersSectionHeader: {
    padding: 0,
    paddingTop: 20,
    pointerEvents: 'none',
  },
  
  connectedUsersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    pointerEvents: 'none',
  },
  
  connectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto',
  },
  
  userInfo: {
    flex: 1,
    marginLeft: 12,
    pointerEvents: 'none',
  },
  
  connectedUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    pointerEvents: 'none',
  },
  
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
    marginRight: 6,
  },
  
  onlineText: {
    color: '#00D4AA',
    fontSize: 12,
    fontWeight: '500',
  },
  
  userActions: {
    marginLeft: 8,
    pointerEvents: 'auto',
  },
  
  userActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  userActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  noUsersContainer: {
    alignItems: 'center',
    padding: 32,
    pointerEvents: 'none',
  },
  
  noUsersText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  
  noUsersSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default RoomInfoModal;
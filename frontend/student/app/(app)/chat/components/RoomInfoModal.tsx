import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Animated,
  ScrollView,
  Dimensions
} from 'react-native';
import { X, Users, Clock, Shield, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RoomInfoModalProps } from '../types/chatTypes';
import Avatar from './Avatar';
import { formatTime } from '../utils/timeUtils';

const { width, height } = Dimensions.get('window');

const RoomInfoModal = ({ room, isVisible, onClose, connectedUsers }: RoomInfoModalProps) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
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
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
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
        Animated.timing(slideAnim, {
          toValue: height,
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

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: overlayOpacity,
          }
        ]}
      >
        <TouchableWithoutFeedback>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: contentScale }
                ]
              }
            ]}
          >
            {/* Background Gradient */}
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['rgba(10, 132, 255, 0.2)', 'rgba(10, 132, 255, 0.1)']}
                style={styles.headerGradient}
              />
              <Text style={styles.modalTitle}>รายละเอียดห้องแชท</Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <View style={styles.closeButtonInner}>
                  <X color="#fff" size={20} />
                </View>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Room Info */}
              <View style={styles.roomInfoContainer}>
                {/* Room Title */}
                <View style={styles.roomTitleContainer}>
                  <Text style={styles.roomInfoTitle}>{room.name.th_name}</Text>
                  <View style={styles.roomBadge}>
                    <Star size={14} color="#FFD700" />
                  </View>
                </View>
                
                {room.description && (
                  <Text style={styles.roomDescription}>{room.description}</Text>
                )}
                
                {/* Room Stats Cards */}
                <View style={styles.statsContainer}>
                  {/* Occupancy Card */}
                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(10, 132, 255, 0.1)', 'rgba(10, 132, 255, 0.05)']}
                      style={styles.statCardGradient}
                    />
                    <Users size={20} color="#0A84FF" />
                    <View style={styles.statContent}>
                      <Text style={styles.statValue}>
                        {connectedUsers.length}/{room.capacity}
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
                    <LinearGradient
                      colors={['rgba(0, 212, 170, 0.1)', 'rgba(0, 212, 170, 0.05)']}
                      style={styles.statCardGradient}
                    />
                    <Clock size={20} color="#00D4AA" />
                    <View style={styles.statContent}>
                      <Text style={styles.statValue}>
                        {formatTime(room.created_at)}
                      </Text>
                      <Text style={styles.statLabel}>สร้างเมื่อ</Text>
                    </View>
                  </View>
                </View>
                
                {/* Security Badge */}
                <View style={styles.securityBadge}>
                  <Shield size={16} color="#00D4AA" />
                  <Text style={styles.securityText}>ห้องแชทปลอดภัย</Text>
                </View>
              </View>
              
              {/* Connected Users Section */}
              <View style={styles.usersSection}>
                <Text style={styles.connectedUsersTitle}>
                  ผู้ใช้ที่กำลังออนไลน์ ({connectedUsers.length})
                </Text>
                
                <View style={styles.connectedUsersList}>
                  {connectedUsers.map((user, index) => (
                    <Animated.View 
                      key={user.id || index} 
                      style={[
                        styles.connectedUser,
                        {
                          opacity: new Animated.Value(0),
                          transform: [{
                            translateX: new Animated.Value(50)
                          }]
                        }
                      ]}
                      onLayout={() => {
                        // Stagger user animations
                        Animated.timing(new Animated.Value(0), {
                          toValue: 1,
                          duration: 300,
                          delay: index * 100,
                          useNativeDriver: true,
                        }).start();
                      }}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                        style={styles.userCardGradient}
                      />
                      <Avatar 
                        name={user.name || user.id} 
                        online={true} 
                        size={42} 
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.connectedUserName}>
                          {user.name || user.id}
                        </Text>
                        <View style={styles.onlineIndicator}>
                          <View style={styles.onlineDot} />
                          <Text style={styles.onlineText}>ออนไลน์</Text>
                        </View>
                      </View>
                      <View style={styles.userActions}>
                        <TouchableOpacity style={styles.userActionButton}>
                          <Text style={styles.userActionText}>@</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                  
                  {connectedUsers.length === 0 && (
                    <View style={styles.noUsersContainer}>
                      <Users size={48} color="#666" />
                      <Text style={styles.noUsersText}>ไม่มีผู้ใช้ออนไลน์</Text>
                      <Text style={styles.noUsersSubtext}>
                        รอให้เพื่อนเข้าร่วมห้องแชท
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
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
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  
  modalContent: {
    backgroundColor: '#1A1A1A',
    maxHeight: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  closeButton: {
    padding: 4,
  },
  
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  roomInfoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  
  roomTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  roomInfoTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.5,
  },
  
  roomBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
  },
  
  roomDescription: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  statCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  
  statContent: {
    marginTop: 8,
  },
  
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  statLabel: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  
  occupancyBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  
  occupancyFill: {
    height: '100%',
    backgroundColor: '#0A84FF',
    borderRadius: 2,
  },
  
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  
  securityText: {
    color: '#00D4AA',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  usersSection: {
    padding: 20,
    paddingTop: 0,
  },
  
  connectedUsersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  
  connectedUsersList: {
    gap: 8,
  },
  
  connectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  userCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  
  connectedUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  
  userActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  userActionText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  noUsersContainer: {
    alignItems: 'center',
    padding: 32,
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
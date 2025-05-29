import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Users, 
  Info, 
  X,
  Reply,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import Avatar from './components/Avatar';
import MessageBubble from './components/MessageBubble';
import SystemMessage from './components/SystemMessage';
import TypingIndicator from './components/TypingIndicator';
import ErrorView from './components/ErrorView';
import JoinBanner from './components/JoinBanner';
import RoomInfoModal from './components/RoomInfoModal';
import StickerPicker from './components/StickerPicker';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Loader from './components/Loader';

// Hooks
import { useChatRoom } from './hooks/useChatRoom';

// Types
import { ChatRoom } from './types/chatTypes';

// Styles
import { enhancedChatStyles } from './constants/enhancedChatStyles';

export default function ChatRoomPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const connectionStatusAnim = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  const {
    room,
    isMember,
    messageText,
    setMessageText,
    loading,
    error,
    joining,
    showEmojiPicker,
    setShowEmojiPicker,
    isRoomInfoVisible,
    setIsRoomInfoVisible,
    replyTo,
    setReplyTo,
    showStickerPicker,
    setShowStickerPicker,
    isConnected,
    wsError,
    connectedUsers,
    typing,
    inputRef,
    userId,
    groupMessages,
    handleJoin,
    handleSendMessage,
    handleImageUpload,
    handleSendSticker,
    handleTyping,
    initializeRoom,
  } = useChatRoom();

  // Enhanced connection status animation
  useEffect(() => {
    Animated.spring(connectionStatusAnim, {
      toValue: wsError ? 1 : 0,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [wsError]);

  // Smooth header animation
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-scroll with better timing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [groupMessages().length]);

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={initializeRoom} />;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowEmojiPicker(false);
      setShowStickerPicker(false);
    }}>
      <View style={enhancedStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Enhanced Background with Mesh Gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={enhancedStyles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Overlay for better text contrast */}
        <View style={enhancedStyles.overlay} />

        <SafeAreaView style={enhancedStyles.safeArea} edges={['top']}>
          {/* Beautiful Header */}
          <Animated.View style={[enhancedStyles.headerContainer, { opacity: headerOpacity }]}>
            <View style={enhancedStyles.headerBlur} />
            
            <View style={enhancedStyles.header}>
              <TouchableOpacity 
                style={enhancedStyles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <View style={enhancedStyles.backButtonInner}>
                  <ChevronLeft color="#fff" size={24} strokeWidth={2} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={enhancedStyles.headerInfo}
                onPress={() => setIsRoomInfoVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={enhancedStyles.headerTitle} numberOfLines={1}>
                  {room?.name?.th_name || 'ห้องแชท'}
                </Text>
                <View style={enhancedStyles.memberInfo}>
                  <View style={[
                    enhancedStyles.onlineIndicator,
                    { backgroundColor: isConnected ? '#00D4AA' : '#FF6B6B' }
                  ]} />
                  <Users size={12} color="rgba(255, 255, 255, 0.8)" strokeWidth={2} />
                  <Text style={enhancedStyles.memberCount}>
                    {connectedUsers.length} คนออนไลน์
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={enhancedStyles.infoButton}
                onPress={() => setIsRoomInfoVisible(true)}
                activeOpacity={0.7}
              >
                <View style={enhancedStyles.infoButtonInner}>
                  <Info color="#fff" size={20} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Connection Status with better animation */}
          <Animated.View 
            style={[
              enhancedStyles.connectionStatus,
              {
                opacity: connectionStatusAnim,
                transform: [{
                  translateY: connectionStatusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-60, 0],
                  })
                }]
              }
            ]}
          >
            <View style={enhancedStyles.connectionStatusInner}>
              <WifiOff size={16} color="#fff" strokeWidth={2} />
              <Text style={enhancedStyles.connectionStatusText}>
                การเชื่อมต่อขัดข้อง กำลังลองใหม่...
              </Text>
            </View>
          </Animated.View>
          
          {/* Enhanced Join Banner */}
          {!room?.is_member && (
            <View style={enhancedStyles.joinBannerContainer}>
              <JoinBanner 
                onJoin={handleJoin} 
                joining={joining} 
                roomCapacity={room?.capacity || 0}
                connectedCount={connectedUsers.length}
              />
            </View>
          )}
          
          {/* Beautiful Reply Banner */}
          {replyTo && (
            <View style={enhancedStyles.replyBannerContainer}>
              <View style={enhancedStyles.replyBanner}>
                <View style={enhancedStyles.replyIndicator} />
                <View style={enhancedStyles.replyContent}>
                  <Reply size={16} color="#667eea" strokeWidth={2} />
                  <View style={enhancedStyles.replyTextContainer}>
                    <Text style={enhancedStyles.replyBannerLabel}>
                      ตอบกลับ {replyTo.senderName || replyTo.senderId}
                    </Text>
                    <Text style={enhancedStyles.replyBannerText} numberOfLines={1}>
                      {replyTo.text}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setReplyTo(undefined)}
                  style={enhancedStyles.replyCloseButton}
                  activeOpacity={0.7}
                >
                  <X size={18} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Messages List */}
          <View style={enhancedStyles.messagesContainer}>
            <MessageList
              messages={groupMessages()}
              userId={userId}
              typing={typing}
              flatListRef={flatListRef}
              onReply={setReplyTo}
              scrollToBottom={() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToEnd({ animated: true });
                }
              }}
            />
          </View>
          
          {/* Enhanced Input Area */}
          <View style={enhancedStyles.inputContainer}>
            <ChatInput
              messageText={messageText}
              setMessageText={setMessageText}
              handleSendMessage={handleSendMessage}
              handleImageUpload={handleImageUpload}
              handleTyping={handleTyping}
              isMember={!!room?.is_member}
              isConnected={isConnected}
              inputRef={inputRef}
              setShowStickerPicker={setShowStickerPicker}
              showStickerPicker={showStickerPicker}
            />
          </View>
          
          {/* Room Info Modal */}
          <RoomInfoModal 
            room={room as ChatRoom} 
            isVisible={isRoomInfoVisible} 
            onClose={() => setIsRoomInfoVisible(false)}
            connectedUsers={connectedUsers}
          />

          {/* Sticker Picker */}
          {showStickerPicker && (
            <StickerPicker
              onSelectSticker={handleSendSticker}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const enhancedStyles = {
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  memberCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoButton: {
    marginLeft: 12,
  },
  infoButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatus: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  connectionStatusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  joinBannerContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  replyBannerContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  replyBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
  },
  replyIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  replyBannerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  replyBannerText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '400',
  },
  replyCloseButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
};
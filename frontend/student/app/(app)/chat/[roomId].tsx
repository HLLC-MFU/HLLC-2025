import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Users } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatService, ChatMessage, ChatRoom } from './services/chatService';
import useProfile from '@/hooks/useProfile';
import { useWebSocket } from './hooks/useWebSocket';

export default function ChatRoomPage() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { user } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { isConnected, error: wsError, sendMessage: wsSendMessage, messages } = useWebSocket(roomId as string);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadRoom = async () => {
    try {
      const rooms = await chatService.getRooms();
      const currentRoom = rooms.find(r => r.id === roomId);
      if (currentRoom) {
        setRoom(currentRoom);
      }
    } catch (err) {
      console.error('Error loading room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      wsSendMessage(message.trim());
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Add WebSocket connection status indicator
  const renderConnectionStatus = () => {
    if (wsError) {
      return <Text style={styles.connectionError}>Connection Error</Text>;
    }
    return (
      <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
        <Text style={styles.connectionText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRoom}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{room?.name.th_name || 'Chat Room'}</Text>
              <View style={styles.memberInfo}>
                <Users size={14} color="#666" />
                <Text style={styles.memberCount}>
                  {room?.connected_users || 0}/{room?.capacity || 0} members
                </Text>
              </View>
            </View>
            {renderConnectionStatus()}
          </View>

          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {!isConnected ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>Connecting to chat server...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : (
              messages.map((msg, index) => {
                if (msg.type === 'join' || msg.type === 'leave') {
                  return (
                    <View key={index} style={styles.systemMessageContainer}>
                      <Text style={styles.systemMessage}>{msg.text}</Text>
                    </View>
                  );
                }
                const isMyMessage = msg.senderId === user?.id;
                return (
                  <View 
                    key={index}
                    style={[
                      styles.messageWrapper,
                      isMyMessage ? styles.myMessage : styles.otherMessage
                    ]}
                  >
                    {!isMyMessage && (
                      <Text style={styles.senderNameAbove}>{msg.senderId}</Text>
                    )}
                    <View style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myBubble : styles.otherBubble
                    ]}>
                      <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Message Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!sending}
            />
            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.sendingButton]}
              onPress={handleSendMessage}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send color="#fff" size={20} />
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#0A84FF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 4,
  },
  senderNameAbove: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '500',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0A84FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingButton: {
    opacity: 0.7,
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#FF5252',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
  },
  connectionError: {
    color: '#FF5252',
    fontSize: 12,
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
}); 
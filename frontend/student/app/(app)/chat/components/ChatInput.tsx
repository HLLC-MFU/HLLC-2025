import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Send, Plus, Smile } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface ChatInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  handleSendMessage: () => void;
  handleImageUpload: () => void;
  handleTyping: () => void;
  isMember: boolean;
  isConnected: boolean;
  inputRef: React.RefObject<TextInput>;
  setShowStickerPicker: (show: boolean) => void;
  showStickerPicker: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  messageText,
  setMessageText,
  handleSendMessage,
  handleImageUpload,
  handleTyping,
  isMember,
  isConnected,
  inputRef,
  setShowStickerPicker,
  showStickerPicker,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const sendButtonScale = useRef(new Animated.Value(0)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const hasText = messageText.trim().length > 0;
  const canSend = hasText && isMember && isConnected;
  const isDisabled = !isMember || !isConnected;

  // Animate send button
  useEffect(() => {
    Animated.spring(sendButtonScale, {
      toValue: hasText ? 1 : 0,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [hasText]);

  // Focus animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowStickerPicker(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSend = () => {
    if (canSend) {
      // Beautiful send animation
      Animated.sequence([
        Animated.spring(inputScale, {
          toValue: 0.96,
          tension: 400,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(inputScale, {
          toValue: 1,
          tension: 400,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
      
      handleSendMessage();
    }
  };

  const toggleStickers = () => {
    setShowStickerPicker(!showStickerPicker);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.2)', '#667eea'],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* Input Container with Gradient Background */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            borderColor,
            transform: [{ scale: inputScale }],
            shadowOpacity,
          },
        ]}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.inputBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Attachment Button */}
        <TouchableOpacity
          style={[styles.attachButton, isDisabled && styles.disabledButton]}
          onPress={handleImageUpload}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={[styles.buttonInner, styles.attachButtonInner]}>
            <Plus
              size={20}
              color={isDisabled ? 'rgba(255, 255, 255, 0.3)' : '#fff'}
              strokeWidth={2.5}
            />
          </View>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isDisabled && styles.inputDisabled,
          ]}
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder={isDisabled ? "กำลังเชื่อมต่อ..." : "พิมพ์ข้อความที่นี่..."}
          placeholderTextColor={isDisabled ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)'}
          multiline
          maxLength={1000}
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlignVertical="center"
          selectionColor="#667eea"
        />

        {/* Send Button with Animation */}
        <Animated.View
          style={[
            styles.sendButtonContainer,
            {
              transform: [
                { scale: sendButtonScale },
                {
                  rotate: sendButtonScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canSend ? ['#667eea', '#764ba2'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Send
                size={18}
                color={canSend ? '#fff' : 'rgba(255, 255, 255, 0.4)'}
                strokeWidth={2.5}
                style={{ transform: [{ translateX: 1 }] }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Sticker Button - Moved to right */}
        <TouchableOpacity
          style={[
            styles.stickerButton,
            showStickerPicker && styles.activeStickerButton,
            isDisabled && styles.disabledButton,
          ]}
          onPress={toggleStickers}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={[
            styles.buttonInner,
            showStickerPicker && styles.activeStickerButtonInner,
          ]}>
            <Smile
              size={20}
              color={
                showStickerPicker 
                  ? '#FFD700' 
                  : isDisabled 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(255, 255, 255, 0.8)'
              }
              strokeWidth={2}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Connection Status Indicator */}
      {!isConnected && (
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 56,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  inputBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
  },
  attachButton: {
    marginRight: 8,
  },
  buttonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: 44,
    fontWeight: '400',
  },
  inputDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  stickerButton: {
    marginLeft: 8,
    marginRight: 8,
  },
  activeStickerButton: {
    // Additional styles for active state
  },
  activeStickerButtonInner: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonContainer: {
    marginLeft: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonInactive: {
    // No additional styles needed
  },
  statusContainer: {
    position: 'absolute',
    top: -4,
    right: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default ChatInput;
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
  const anim = useRef(new Animated.Value(0)).current;
  const hasText = messageText.trim().length > 0;
  const isDisabled = !isMember || !isConnected;
  const canSend = hasText && !isDisabled;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowStickerPicker(false);
  };

  const handleSend = () => {
    if (canSend) {
      handleSendMessage();
    }
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.2)', '#667eea'],
  });

  const shadowOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inputContainer, { borderColor, shadowOpacity }]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.inputBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.disabled]}
          onPress={handleImageUpload}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={styles.buttonInner}>
            <Plus size={20} color={isDisabled ? 'rgba(255, 255, 255, 0.3)' : '#fff'} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[styles.input, isDisabled && styles.disabled]}
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
          onBlur={() => setIsFocused(false)}
          textAlignVertical="center"
          selectionColor="#667eea"
        />

        {hasText && (
          <TouchableOpacity
            style={[styles.button, styles.sendButton, !canSend && styles.disabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canSend ? ['#667eea', '#764ba2'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.buttonInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Send size={18} color={canSend ? '#fff' : 'rgba(255, 255, 255, 0.4)'} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, showStickerPicker && styles.activeSticker, isDisabled && styles.disabled]}
          onPress={() => setShowStickerPicker(!showStickerPicker)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={[styles.buttonInner, showStickerPicker && styles.activeStickerInner]}>
            <Smile
              size={20}
              color={showStickerPicker ? '#FFD700' : isDisabled ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)'}
              strokeWidth={2}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {!isConnected && (
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    padding: 6,
    minHeight: 56,
    borderWidth: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
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
  button: {
    marginHorizontal: 4,
  },
  buttonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  sendButton: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  activeSticker: {},
  activeStickerInner: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  disabled: {
    opacity: 0.5,
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
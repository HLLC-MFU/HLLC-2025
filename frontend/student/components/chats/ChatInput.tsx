import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Keyboard,
  Text,
} from 'react-native';
import { Send, Plus, Smile, Reply } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Message } from '@/types/chatTypes';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  messageText: string;
  handleTextInput: (text: string) => void;
  handleSendMessage: () => void;
  handleImageUpload: () => void;
  isMember: boolean;
  isConnected: boolean;
  inputRef: React.RefObject<TextInput | null>;
  setShowStickerPicker: (show: boolean) => void;
  showStickerPicker: boolean;
  replyTo?: Message;
  setReplyTo?: (msg?: Message) => void;
  canSendImage?: boolean;
}

const ChatInput = ({
  messageText,
  handleTextInput,
  handleSendMessage,
  handleImageUpload,
  isMember,
  isConnected,
  inputRef,
  setShowStickerPicker,
  showStickerPicker,
  replyTo,
  setReplyTo,
  canSendImage = true,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const hasText = messageText.trim().length > 0;
  const isDisabled = !isMember || !isConnected;
  const canSend = hasText && !isDisabled;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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
      {replyTo && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 8,
          marginBottom: 4,
          marginHorizontal: 2,
        }}>
          <Reply size={16} color="#8E8E93" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', opacity: 0.7, flex: 1 }} numberOfLines={1}>
            {replyTo.text}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo && setReplyTo(undefined)}>
            <Text style={{ color: '#8E8E93', fontSize: 16, marginLeft: 8 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <Animated.View style={[styles.inputContainer, { borderColor, shadowOpacity }]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.inputBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {canSendImage && (
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
        )}

        <TextInput
          ref={inputRef}
          style={[styles.input, isDisabled && styles.disabled]}
          value={messageText}
          onChangeText={(text) => {
            handleTextInput(text);
          }}
          placeholder={isDisabled ? t('chat.connecting') : t('chat.typeMessage')}
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
  container: { 
    position: 'relative', 
    marginBottom: 20, 
    marginLeft: 10, 
    marginRight: 10,
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,
  },
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
    borderRadius: 9999,
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
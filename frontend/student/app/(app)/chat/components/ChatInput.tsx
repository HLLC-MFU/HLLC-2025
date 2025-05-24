import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ImageIcon, Smile, Send } from 'lucide-react-native';
import { PLACEHOLDER_MESSAGES, MAX_MESSAGE_LENGTH } from '../constants/chatConstants';

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
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.inputContainer}
    >
      <View style={styles.inputWrapper}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handleImageUpload}
          disabled={!isMember || !isConnected}
        >
          <ImageIcon color={(!isMember || !isConnected) ? "#555" : "#0A84FF"} size={22} />
        </TouchableOpacity>
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input, 
            (!isMember || !isConnected) && styles.disabledInput
          ]}
          placeholder={
            !isMember 
              ? PLACEHOLDER_MESSAGES.JOIN_TO_CHAT
              : !isConnected 
                ? PLACEHOLDER_MESSAGES.CONNECTING
                : PLACEHOLDER_MESSAGES.TYPE_MESSAGE
          }
          placeholderTextColor="#666"
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            handleTyping();
          }}
          editable={isMember}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          autoCapitalize="none"
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        
        <TouchableOpacity 
          style={styles.emojiButton}
          onPress={() => setShowStickerPicker(!showStickerPicker)}
          disabled={!isMember}
        >
          <Smile color={!isMember ? "#555" : "#0A84FF"} size={22} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!isMember || !messageText.trim()) && styles.disabledSendButton
          ]}
          onPress={handleSendMessage}
          disabled={!isMember || !messageText.trim()}
          activeOpacity={0.7}
        >
          <Send color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: { 
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1, 
    borderTopColor: '#2A2A2A',
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { 
    flex: 1, 
    backgroundColor: '#333', 
    borderRadius: 20, 
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#fff', 
    marginHorizontal: 8,
    maxHeight: 120,
    minHeight: 40,
    fontSize: 16,
  },
  disabledInput: { 
    opacity: 0.6 
  },
  attachButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: { 
    backgroundColor: '#0A84FF', 
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  disabledSendButton: { 
    backgroundColor: '#555', 
    opacity: 0.5 
  },
});

export default ChatInput; 
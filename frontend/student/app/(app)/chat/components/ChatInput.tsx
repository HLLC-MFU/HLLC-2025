import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image as ImageIcon, Send, Smile } from 'lucide-react-native';

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
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleImageUpload}
          disabled={!isMember || !isConnected}
        >
          <ImageIcon
            size={24}
            color={isMember && isConnected ? '#0A84FF' : '#666'}
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder="พิมพ์ข้อความ..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
          editable={isMember && isConnected}
          onFocus={() => {
            if (showStickerPicker) {
              setShowStickerPicker(false);
            }
          }}
        />

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowStickerPicker(!showStickerPicker)}
          disabled={!isMember || !isConnected}
        >
          <Smile
            size={24}
            color={isMember && isConnected ? '#0A84FF' : '#666'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || !isMember || !isConnected) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || !isMember || !isConnected}
        >
          <Send
            size={20}
            color={messageText.trim() && isMember && isConnected ? '#fff' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#0A84FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
});

export default ChatInput; 
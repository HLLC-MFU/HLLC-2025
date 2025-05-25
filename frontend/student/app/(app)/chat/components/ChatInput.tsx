import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTyping: () => void;
  onStickerPress: () => void;
  onImagePress: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  onStickerPress,
  onImagePress,
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleImagePress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        onImagePress();
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onStickerPress} style={styles.iconButton}>
        <Ionicons name="happy-outline" size={24} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleImagePress} style={styles.iconButton}>
        <Ionicons name="image-outline" size={24} color="#666" />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={message}
        onChangeText={(text) => {
          setMessage(text);
          onTyping();
        }}
        placeholder="Type a message..."
        placeholderTextColor="#999"
        multiline
        maxLength={1000}
      />

      <TouchableOpacity 
        onPress={handleSend}
        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
        disabled={!message.trim()}
      >
        <Ionicons 
          name="send" 
          size={24} 
          color={message.trim() ? '#007AFF' : '#999'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    maxHeight: 100,
    color: '#000',
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 
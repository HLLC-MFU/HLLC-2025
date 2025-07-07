import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { RoomMember } from '@/types/chatTypes';

interface MentionSuggestionsProps {
  suggestions: RoomMember[];
  onSelect: (user: RoomMember) => void;
}

const MentionSuggestions = ({ suggestions, onSelect }:MentionSuggestionsProps) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.suggestionItem} onPress={() => onSelect(item)}>
            <Image 
              source={{ uri: item.user.profile_image_url || 'https://www.gravatar.com/avatar/?d=mp' }} 
              style={styles.avatar} 
            />
            <Text style={styles.username}>
              {item.user_id === 'all' 
                ? 'แจ้งทุกคน' 
                : item.user.name && item.user.name.first && item.user.name.last 
                  ? `${item.user.name.first} ${item.user.name.last}`.trim()
                  : item.user.username || 'Unknown User'
              }
            </Text>
          </TouchableOpacity>
        )}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85, // Adjust this based on your input field's height
    left: 10,
    right: 10,
    maxHeight: 150,
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MentionSuggestions; 
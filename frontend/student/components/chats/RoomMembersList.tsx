import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { RoomMember } from '@/types/chatTypes';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import Avatar from './Avatar';

interface RoomMembersListProps {
  roomId: string;
  onMemberPress?: (member: RoomMember) => void;
}

const RoomMembersList = ({
  roomId,
  onMemberPress,
}:RoomMembersListProps) => {
  const { loadMembers, loadMoreMembers, members, total, loading, hasMore } = useChatRoom();

  useEffect(() => {
    // Load initial members when component mounts
    loadMembers(1, false);
  }, [roomId]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreMembers();
    }
  };

  const handleRefresh = () => {
    loadMembers(1, false);
  };

  const renderMember = ({ item }: { item: RoomMember }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => onMemberPress?.(item)}
      activeOpacity={0.7}
    >
      <Avatar
        size={40}
        name={`${item.user.name.first} ${item.user.name.last}`}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.user.name.first && item.user.name.last
            ? `${item.user.name.first} ${item.user.name.last}`
            : item.user.username || 'Unknown User'}
        </Text>
        {item.user.username && (
          <Text style={styles.memberUsername}>@{item.user.username}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more members...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No members found</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Members ({total})</Text>
      </View>
      
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.user_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading && members.length === 0}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={20}
        getItemLayout={(data, index) => ({
          length: 70,
          offset: 70 * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default RoomMembersList; 
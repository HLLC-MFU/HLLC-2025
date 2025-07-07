import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';

import { ChatRoom } from '@/types/chatTypes';
import { useChatRoom } from '@/hooks/chats/useChatRoom';
import RoomMembersList from './RoomMembersList';
import Avatar from './Avatar';

interface RoomInfoProps {
  room: ChatRoom;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const RoomInfo = ({ room, onClose }:RoomInfoProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const { handleJoin, joining, isMember } = useChatRoom();

  const handleJoinPress = () => {
    if (!isMember) {
      Alert.alert(
        'Join Room',
        `Are you sure you want to join "${room.name.th}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join', onPress: handleJoin },
        ]
      );
    }
  };

  const handleMemberPress = (member: any) => {
    // Handle member press - could show profile or start DM
    console.log('Member pressed:', member);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Room Information</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members ({room.members_count})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'info' ? (
          <ScrollView style={styles.infoContainer} showsVerticalScrollIndicator={false}>
            {/* Room Avatar */}
            <View style={styles.avatarContainer}>
              <Avatar
                size="xl"
                source={room.image ? { uri: room.image } : undefined}
                fallback={room.name.th?.[0] || 'R'}
              />
            </View>

            {/* Room Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room Name</Text>
              <Text style={styles.roomName}>{room.name.th}</Text>
              {room.name.en && room.name.en !== room.name.th && (
                <Text style={styles.roomNameEn}>{room.name.en}</Text>
              )}
            </View>

            {/* Room Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{room.category}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capacity:</Text>
                <Text style={styles.detailValue}>{room.members_count}/{room.capacity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>{formatDate(room.created_at)}</Text>
              </View>
            </View>

            {/* Join Button */}
            {!isMember && (
              <TouchableOpacity
                style={[styles.joinButton, joining && styles.joinButtonDisabled]}
                onPress={handleJoinPress}
                disabled={joining}
              >
                <Text style={styles.joinButtonText}>
                  {joining ? 'Joining...' : 'Join Room'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Member Status */}
            {isMember && (
              <View style={styles.memberStatus}>
                <Text style={styles.memberStatusText}>✓ You are a member</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <RoomMembersList
            roomId={room.id}
            onMemberPress={handleMemberPress}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  roomNameEn: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  joinButtonDisabled: {
    backgroundColor: '#CCC',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberStatus: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  memberStatusText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RoomInfo; 
import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { X, Users } from 'lucide-react-native';
import { RoomInfoModalProps } from '../types/chatTypes';
import Avatar from './Avatar';
import { formatTime } from '../utils/timeUtils';

const RoomInfoModal = ({ room, isVisible, onClose, connectedUsers }: RoomInfoModalProps) => {
  if (!isVisible || !room) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดห้องแชท</Text>
              <TouchableOpacity onPress={onClose}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.roomInfoContainer}>
              <Text style={styles.roomInfoTitle}>{room.name.th_name}</Text>
              {room.description && (
                <Text style={styles.roomDescription}>{room.description}</Text>
              )}
              
              <View style={styles.roomStats}>
                <View style={styles.roomStat}>
                  <Users size={16} color="#0A84FF" />
                  <Text style={styles.roomStatText}>
                    {connectedUsers.length}/{room.capacity} คน
                  </Text>
                </View>
                
                <View style={styles.roomStat}>
                  <Text style={styles.roomStatText}>
                    สร้างเมื่อ {formatTime(room.created_at)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.connectedUsersTitle}>ผู้ใช้ที่กำลังออนไลน์</Text>
              <View style={styles.connectedUsersList}>
                {connectedUsers.map((user, index) => (
                  <View key={user.id || index} style={styles.connectedUser}>
                    <Avatar name={user.name || user.id} online={true} size={36} />
                    <Text style={styles.connectedUserName}>{user.name || user.id}</Text>
                  </View>
                ))}
                
                {connectedUsers.length === 0 && (
                  <Text style={styles.noUsersText}>ไม่มีผู้ใช้ออนไลน์</Text>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomInfoContainer: {
    padding: 16,
  },
  roomInfoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roomDescription: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  roomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  roomStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginRight: 12,
  },
  roomStatText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  connectedUsersTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  connectedUsersList: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 12,
  },
  connectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  connectedUserName: {
    color: '#fff',
    fontSize: 15,
  },
  noUsersText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default RoomInfoModal; 
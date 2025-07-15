import React, { useEffect, useState } from 'react';
import { X, Users, Clock, Shield, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from './Avatar';
import { formatTime } from '@/utils/chats/timeUtils';

interface ConnectedUser {
  id: string;
  name?: string;
}

interface RoomInfoModalProps {
  room: {
    name?: { th?: string; en?: string };
    description?: string;
    capacity: number;
    created_at?: string;
  };
  isVisible: boolean;
  onClose: () => void;
  connectedUsers: ConnectedUser[];
}

const RoomInfoModal = ({ room, isVisible, onClose, connectedUsers }: RoomInfoModalProps) => {
  const { t, i18n } = useTranslation();
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [contentScale, setContentScale] = useState(0.9);

  const getRoomName = (room: RoomInfoModalProps['room']) => {
    if (!room?.name) return t('roomInfo.unnamedRoom');

    const currentLang = i18n.language;
    if (currentLang === 'th' && room.name.th) {
      return room.name.th;
    } else if (currentLang === 'en' && room.name.en) {
      return room.name.en;
    }
    return room.name.th || room.name.en || t('roomInfo.unnamedRoom');
  };

  useEffect(() => {
    if (isVisible) {
      setOverlayOpacity(1);
      setContentScale(1);
    } else {
      setOverlayOpacity(0);
      setContentScale(0.9);
    }
  }, [isVisible]);

  if (!isVisible || !room) return null;

  const occupancyPercentage = (connectedUsers.length / room.capacity) * 100;

  const renderHeader = () => (
    <div className="header-section">
      <div className="room-title-container">
        <h2 className="room-info-title">{getRoomName(room)}</h2>
      </div>

      {room.description && <p className="room-description">{room.description}</p>}

      <div className="stats-container">
        <div className="stat-card">
          <Users size={20} color="#fff" />
          <div className="stat-content">
            <p className="stat-value">{connectedUsers.length}/{room.capacity || 0}</p>
            <p className="stat-label">{t('roomInfo.users')}</p>
            <div className="occupancy-bar">
              <div
                className="occupancy-fill"
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <Clock size={20} color="#fff" />
          <div className="stat-content">
            <p className="stat-value">
              {room.created_at ? formatTime(room.created_at) : t('roomInfo.createdAt')}
            </p>
            <p className="stat-label">{t('roomInfo.createdAt')}</p>
          </div>
        </div>
      </div>

      <div className="security-badge">
        <Shield size={16} color="#fff" />
        <p className="security-text">{t('roomInfo.secureRoom')}</p>
      </div>

      <div className="users-section-header">
        <p className="connected-users-title">
          {t('roomInfo.onlineUsers')} ({connectedUsers.length})
        </p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="no-users-container">
      <Users size={48} color="#fff" />
      <p className="no-users-text">{t('roomInfo.noUsersOnline')}</p>
      <p className="no-users-subtext">{t('roomInfo.waitingForFriends')}</p>
    </div>
  );

  return (
    <div
      className="modal-overlay"
      style={{ opacity: overlayOpacity }}
      onClick={onClose}
    >
      <div className="modal-content" style={{ transform: `scale(${contentScale})` }}>
        <div className="modal-background"></div>

        <div className="modal-header">
          <h3 className="modal-title">{t('roomInfo.roomDetails')}</h3>
          <button onClick={onClose} className="close-button">
            <X color="#fff" size={20} />
          </button>
        </div>

        <div className="scroll-container">
          <div className="header-section">{renderHeader()}</div>

          <div className="user-list">
            {connectedUsers.length === 0 ? renderEmptyState() : null}

            {connectedUsers.map((user: ConnectedUser) => (
              <div className="connected-user" key={user.id}>
                <Avatar name={user.name || user.id || 'Unknown User'} online={true} size={42} />
                <div className="user-info">
                  <p className="connected-user-name">{user.name || user.id || t('chat.unknownUser')}</p>
                  <div className="online-indicator">
                    <div className="online-dot" />
                    <p className="online-text">{t('roomInfo.online')}</p>
                  </div>
                </div>
                <div className="user-actions">
                  <button className="user-action-button">@</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInfoModal;

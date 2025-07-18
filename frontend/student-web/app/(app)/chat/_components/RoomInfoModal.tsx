import React, { useEffect, useState } from 'react';
import { X, Users, Clock, Shield } from 'lucide-react';
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
  } | null;
  isVisible: boolean;
  onClose: () => void;
  connectedUsers: ConnectedUser[];
  loading?: boolean;
}

const RoomInfoModal = ({ room, isVisible, onClose, connectedUsers, loading }: RoomInfoModalProps) => {
  const { t, i18n } = useTranslation();

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col p-8 animate-pulse">
          {/* Skeleton for room name */}
          <div className="h-6 w-2/3 bg-gray-200 rounded mb-4 mx-auto" />
          {/* Skeleton for description */}
          <div className="h-4 w-1/2 bg-gray-100 rounded mb-8 mx-auto" />
          {/* Skeleton for stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <div className="h-5 w-10 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-16 bg-gray-100 rounded mb-1" />
              <div className="h-2 w-full bg-gray-200 rounded mt-2" />
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <div className="h-5 w-10 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-16 bg-gray-100 rounded mb-1" />
            </div>
          </div>
          {/* Skeleton for member list */}
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-12 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!room) return null;

  const occupancyPercentage = (connectedUsers.length / room.capacity) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400 " />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Room Name */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {getRoomName(room)}
            </h2>
            {room.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {room.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Users size={20} className="text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {room.capacity === 0
                  ? `${connectedUsers.length}/∞`
                  : `${connectedUsers.length}/${room.capacity}`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('Capacity')}
              </div>
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded mt-2">
                <div 
                  className="h-1 bg-blue-500 rounded transition-all"
                  style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Clock size={20} className="text-gray-500 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {room.created_at ? formatTime(room.created_at) : '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('Created')}
              </div>
            </div>
          </div>

          {/* Online Users */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('Members')} ({connectedUsers.length})
            </h4>
            
            {connectedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-sm">{t('roomInfo.noUsersOnline')}</div>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedUsers.map((user: ConnectedUser) => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Avatar 
                      name={user.name || user.id || 'Unknown User'} 
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {user.name || user.id || t('chat.unknownUser')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInfoModal;

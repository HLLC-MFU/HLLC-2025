import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChatRoomWithId {
  id?: string;
  _id?: string;
  name?: any;
  is_member?: boolean;
  [key: string]: any;
}

interface ConfirmJoinModalProps {
  visible: boolean;
  room: ChatRoomWithId | null;
  language: 'th' | 'en';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmJoinModal = ({ visible, room, language, onConfirm, onCancel }: ConfirmJoinModalProps) => {
  const { t } = useTranslation();
  if (!visible || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onCancel} />
      
      {/* Modal content */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-4">
          {t('chat.confirmJoin')}
        </h3>
        
        {/* Room name */}
        <p className="text-lg text-white/90 text-center mb-8">
          {room.name[language] ?? 'Unnamed'}
        </p>
        
        {/* Button row */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/30 text-white font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 active:scale-95"
          >
            {t('global.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-white/15 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 active:scale-95"
          >
            {t('global.join')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmJoinModal; 
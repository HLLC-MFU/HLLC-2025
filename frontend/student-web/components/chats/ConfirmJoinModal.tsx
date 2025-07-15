import React from 'react';

interface ConfirmJoinModalProps {
  visible: boolean;
  room: any;
  language: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmJoinModal = ({ visible, room, language, onConfirm, onCancel }: ConfirmJoinModalProps) => {
  if (!room || !visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="backdrop-blur-md bg-slate-800/90 rounded-2xl p-8 w-[320px] flex flex-col items-center shadow-xl">
        <span className="text-lg font-bold text-white mb-2">
          {language === 'th' ? 'ยืนยันการเข้าร่วมห้อง' : 'Confirm Join Room'}
        </span>
        <span className="text-base text-blue-100 mb-4">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </span>
        <div className="flex flex-row gap-3 w-full mt-2">
          <button
            className="flex-1 py-2 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition"
            onClick={onCancel}
            type="button"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
            onClick={onConfirm}
            type="button"
          >
            {language === 'th' ? 'เข้าร่วม' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmJoinModal; 
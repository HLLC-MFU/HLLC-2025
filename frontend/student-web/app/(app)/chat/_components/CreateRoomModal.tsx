"use client";

import React, { useState, ChangeEvent } from 'react';

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface CreateRoomFormData {
  name: {
    thName: string;
    enName: string;
  };
  capacity: number;
  image?: string;
}

const CreateRoomModal = ({
  visible,
  onClose,
  onSuccess,
  userId,
}: CreateRoomModalProps) => {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: { thName: '', enName: '' },
    capacity: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('Please select an image smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRoom = async () => {
    if (!formData.name.thName || !formData.name.enName) {
      setError('Please enter both Thai and English room names');
      return;
    }
    if (!formData.capacity || formData.capacity < 2) {
      setError('Room capacity must be at least 2');
      return;
    }
    setLoading(true);
    setError(null);
    // TODO: Call API to create room here
    setTimeout(() => {
      setLoading(false);
      setFormData({ name: { thName: '', enName: '' }, capacity: 10 });
      setSelectedImage(null);
      onClose();
      onSuccess();
    }, 1000);
  };

  const handleClose = () => {
    setFormData({ name: { thName: '', enName: '' }, capacity: 10 });
    setError(null);
    setSelectedImage(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="backdrop-blur-md bg-white/30 rounded-2xl p-8 w-[340px] flex flex-col items-center shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <span className="text-xl font-bold text-white">Create New Chat Room</span>
          <button onClick={handleClose} className="p-1 text-white text-lg">✕</button>
        </div>
        <label className="w-28 h-28 mb-4 rounded-xl bg-white/10 border-2 border-white flex items-center justify-center cursor-pointer overflow-hidden relative">
          {selectedImage ? (
            <img src={selectedImage} alt="Room" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-4xl text-white/70">📷</span>
          )}
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
        </label>
        <div className="w-full mb-3">
          <label className="text-white font-semibold text-sm mb-1 block">Thai Name</label>
          <input
            className="w-full bg-white/10 p-3 rounded-lg text-white text-base border border-white/20 mb-1"
            placeholder="Room Name (Thai)"
            value={formData.name.thName}
            maxLength={30}
            onChange={e => setFormData(prev => ({ ...prev, name: { ...prev.name, thName: e.target.value } }))}
          />
          <span className="text-xs text-white/60 float-right">{formData.name.thName.length}/30</span>
        </div>
        <div className="w-full mb-3">
          <label className="text-white font-semibold text-sm mb-1 block">English Name</label>
          <input
            className="w-full bg-white/10 p-3 rounded-lg text-white text-base border border-white/20 mb-1"
            placeholder="Room Name (English)"
            value={formData.name.enName}
            maxLength={30}
            onChange={e => setFormData(prev => ({ ...prev, name: { ...prev.name, enName: e.target.value } }))}
          />
          <span className="text-xs text-white/60 float-right">{formData.name.enName.length}/30</span>
        </div>
        <div className="w-full mb-3">
          <label className="text-white font-semibold text-sm mb-1 block">Capacity</label>
          <input
            className="w-full bg-white/10 p-3 rounded-lg text-white text-base border border-white/20 mb-1"
            placeholder="Maximum number of users"
            value={formData.capacity.toString()}
            onChange={e => {
              let value = parseInt(e.target.value, 10);
              if (isNaN(value) || value < 2) value = 2;
              setFormData(prev => ({ ...prev, capacity: value }));
            }}
            type="number"
            min={2}
            max={100}
            maxLength={3}
          />
          <span className="text-xs text-white/60">Capacity must be between 2-100 users</span>
        </div>
        {error && <span className="text-red-400 text-sm mb-2 text-center w-full bg-red-100/10 p-2 rounded-lg">{error}</span>}
        <div className="flex flex-row gap-3 w-full mt-2 mb-2">
          <button
            className="flex-1 py-2 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition"
            onClick={handleClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
            onClick={handleCreateRoom}
            disabled={loading || !formData.name.thName.trim() || !formData.name.enName.trim()}
            type="button"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal; 
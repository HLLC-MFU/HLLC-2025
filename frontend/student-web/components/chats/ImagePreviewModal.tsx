import React from 'react';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal = ({ visible, imageUrl, onClose }: ImagePreviewModalProps) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fadein">
      <button
        className="absolute top-6 right-6 bg-black/60 rounded-full p-2 text-white text-2xl hover:bg-black/80 focus:outline-none"
        onClick={onClose}
        aria-label="Close preview"
        type="button"
      >
        ×
      </button>
      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-[90vw] max-h-[80vh] rounded-xl shadow-lg border border-white/10 object-contain"
        onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
      />
    </div>
  );
};

export default ImagePreviewModal; 
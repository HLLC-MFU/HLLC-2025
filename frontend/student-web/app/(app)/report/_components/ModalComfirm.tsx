'use client';

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Confirm Submission',
  description = 'This action cannot be undone.',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg p-6 text-white">
        <h2 className="text-lg font-semibold text-center mb-2">{title}</h2>
        <p className="text-sm text-gray-300 text-center mb-6">{description}</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-white text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

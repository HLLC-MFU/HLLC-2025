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
      <div className="w-full max-w-md bg-white backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-6 text-center space-y-6">
        <h2 className="text-xl font-semibold text-black/80">{title}</h2>
        <p className="text-sm text-black/60">{description}</p>
        <div className="flex justify-between gap-4 pt-2">
          <button
            onClick={onCancel}
            className="w-full py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold transition"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}

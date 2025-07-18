'use client';

import {
  Modal,
  ModalBody,
  ModalContent,
  Button,
} from '@heroui/react';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      placement="center"
      className="bg-black/40 backdrop-blur-sm px-4"
    >
      <ModalContent className="w-[400px] max-w-md bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
        <ModalBody className="space-y-6 text-center py-6 px-6">
          <h2 className="text-xl font-semibold text-black/80">{title}</h2>
          <p className="text-sm text-black/60">{description}</p>
          <div className="flex justify-between gap-4 pt-2">
            <Button
              onPress={onCancel}
              className="w-full py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition"
            >
              CANCEL
            </Button>
            <Button
              onPress={onConfirm}
              className="w-full py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold transition"
            >
              CONFIRM
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

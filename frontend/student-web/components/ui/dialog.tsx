'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { create } from 'zustand';

interface DialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onClose?: () => void;
  openDialog: (
    title: string,
    description: string,
    onClose?: () => void,
  ) => void;
  closeDialog: () => void;
}

interface OpenDialogFn {
  (title: string, description: string, onClose?: () => void): void;
}

interface CloseDialogFn {
  (): void;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onClose?: () => void;
  openDialog: OpenDialogFn;
  closeDialog: CloseDialogFn;
}

export const usePopupDialog = create<DialogState>(set => ({
  isOpen: false,
  title: '',
  description: '',
  onClose: undefined,
  openDialog: (
    title: string,
    description: string,
    onClose?: () => void,
  ): void => set({ isOpen: true, title, description, onClose }),
  closeDialog: (): void =>
    set(state => {
      state.onClose?.();

      return {
        isOpen: false,
        title: '',
        description: '',
        onClose: undefined,
      };
    }),
}));

export default function PopupDialog() {
  const { isOpen, title, description, closeDialog } = usePopupDialog();

  return (
    <Modal
      backdrop="opaque"
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={closeDialog}
    >
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-base text-gray-600 text-center">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={closeDialog}>
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

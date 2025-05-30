"use client";

import { Campaign } from "@/types/campaign";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { addToast } from "@heroui/react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaign: Campaign | undefined;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  campaign,
}: DeleteConfirmationModalProps) => {
  const handleConfirm = async () => {
    try {
      if (!campaign) {
        throw new Error("No campaign selected for deletion");
      }
      await onConfirm();
      addToast({
        title: "ลบแคมเปญสำเร็จ",
        color: "success",
        description: "แคมเปญถูกลบเรียบร้อยแล้ว",
        variant: "solid",
      });
      onClose();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      addToast({
        title: "เกิดข้อผิดพลาด",
        color: "danger",
        description: "ไม่สามารถลบแคมเปญได้ กรุณาลองใหม่อีกครั้ง",
        variant: "solid",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Delete Campaign</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete the campaign "{campaign?.name.th}"? This
            action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="danger" onPress={handleConfirm}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 
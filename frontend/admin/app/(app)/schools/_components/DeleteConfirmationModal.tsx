import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import type { School } from "@/types/school";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    school?: School;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, school }: DeleteConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Delete School
                </ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to delete <span className="font-semibold">{school?.name.en}</span>?</p>
                    <p className="text-sm text-default-500">This action cannot be undone.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={onConfirm}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 
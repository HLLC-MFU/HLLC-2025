import { Appearance } from "@/types/appearance";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    appearance?: Appearance;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, appearance }: DeleteConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Delete Major
                </ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to delete the Appearance "{appearance?.school?.name?.en}"? This action cannot be undone.</p>
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
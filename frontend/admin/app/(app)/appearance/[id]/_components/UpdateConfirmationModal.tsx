import { Appearance } from "@/types/appearance";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface UpdateConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    appearance?: Appearance;
}

export function UpdateConfirmationModal({ isOpen, onClose, onConfirm, appearance }: UpdateConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Update Major
                </ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to Update the Appearance ? This action cannot be undone.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="success" onPress={onConfirm}>
                        Update
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 
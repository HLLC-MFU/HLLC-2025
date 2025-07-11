import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

import { LamduanFlowers } from "@/types/lamduan-flowers";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    lamduanflower?: LamduanFlowers
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, lamduanflower }: DeleteConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Delete Comment
                </ModalHeader>
                <ModalBody>
                    <p>Are you sure want to delete <span className="font-semibold">{lamduanflower?.user.username}</span></p>
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
    )
}
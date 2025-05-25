import { Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

interface ResponseDialogProps {
    dialog: string;
    isOpen: boolean;
    onClose: () => void;
    color: "success" | "danger";
}

export default function ResponseDialog({ dialog, isOpen, onClose, color, }: ResponseDialogProps) {

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} placement="top">
                <ModalContent>
                    <Alert color={color} title={dialog} />
                </ModalContent>
            </Modal>
        </>
    );
};
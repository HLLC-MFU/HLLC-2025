import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

type ConfirmationModalProps = {
    isOpen: boolean;
    title: string;
    subtitle: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmationModal({ isOpen, title, subtitle, onClose, onConfirm }: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}  placement="bottom">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    {title}
                </ModalHeader>
                <ModalBody>
                    {subtitle}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={onConfirm}>
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 
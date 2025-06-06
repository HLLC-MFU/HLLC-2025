import { Sponsor } from "@/types/sponsor";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sponsor?:Sponsor;
}

export function DeleteConfirmationModal({ isOpen , onClose , onConfirm , sponsor}: DeleteConfirmationModalProps) {
    return(
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Delete Sponsor
                </ModalHeader>
                <ModalBody>
                    <p>Are you sure want to delete <span className="font-semibold">{sponsor?.name.en}</span></p>
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
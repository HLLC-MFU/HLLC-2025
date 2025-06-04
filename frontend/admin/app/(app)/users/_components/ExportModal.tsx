import React from "react"
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

export interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (fileName: string) => void;
}

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
    const fileNameRef = React.useRef<HTMLInputElement>(null);

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalContent>
                <Form
                    className="w-full"
                    onSubmit={(e) => {
                        e.preventDefault();
                        onExport(fileNameRef.current?.value || "Data");
                    }}
                >
                    <ModalHeader className="flex flex-col gap-1">Export File</ModalHeader>
                    <ModalBody className="w-full">
                        <Input
                            type="string"
                            label="File Name"
                            placeholder={fileNameRef.current?.value || "Data"}
                            ref={fileNameRef}
                        />
                    </ModalBody>
                    <ModalFooter className="w-full">
                        <Button color="danger" variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            Confirm
                        </Button>
                    </ModalFooter>
                </Form>
            </ModalContent>
        </Modal>
    );
};
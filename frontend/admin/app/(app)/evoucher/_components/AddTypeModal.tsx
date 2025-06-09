import React, { FormEvent, useRef } from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { EvoucherType } from "@/types/evoucher-type";

export type AddTypeProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddType: (role: Partial<EvoucherType>) => void;
}

export default function AddTypeModal({ isOpen, onClose, onAddType }: AddTypeProps) {
    const roleNameRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData: Partial<EvoucherType> = {
            name: roleNameRef.current?.value
        };

        onAddType(formData);
    };

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
                    onSubmit={(e) => handleSubmit(e)}
                >
                    <ModalHeader className="flex flex-col gap-1">Add new type</ModalHeader>
                    <ModalBody className="w-full">
                        <Input
                            isRequired
                            type="string"
                            label="Type Name"
                            placeholder="Enter Type Name"
                            ref={roleNameRef}
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
    )
};
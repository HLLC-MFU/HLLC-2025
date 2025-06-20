import React from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Role } from "@/types/role";

export type AddRoleProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddRole: (role: Partial<Role>) => void;
}

export default function AddRoleModal({ isOpen, onClose, onAddRole }: AddRoleProps) {
    const roleNameRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData: Partial<Role> = {
            name: roleNameRef.current?.value!,
            permissions: ["*"],
            metadataSchema: {
                major: {
                    type: "string",
                    label: "major",
                    required: true,
                }
            }
        };

        onAddRole(formData);
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
                    <ModalHeader className="flex flex-col gap-1">Add new role</ModalHeader>
                    <ModalBody className="w-full">
                        <Input
                            isRequired
                            type="string"
                            label="Role Name"
                            placeholder="Enter Role Name"
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
"use client";
import React, { FormEvent, useState } from "react";
import {
    Button,
    Form,
    Input,
    Select,
    SelectItem,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Checkbox,
    Card,
    CardHeader,
} from "@heroui/react";
import { Trash2 } from "lucide-react";

import { Role } from "@/types/role";

type AddRoleProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddRole: (role: Partial<Role>) => void;
}

export default function AddRoleModal({ isOpen, onClose, onAddRole }: AddRoleProps) {
    const [fields, setFields] = useState<Field[]>([]);
    const [roleName, setRoleName] = useState<string>("");

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const metadataSchema: Role["metadataSchema"] = fields.reduce((acc, field) => {
            acc[field.label] = {
                type: field.type,
                label: field.label,
                required: field.required,
            };

            return acc;
        }, {} as NonNullable<Role["metadataSchema"]>);

        const formData: Partial<Role> = {
            name: roleName,
            metadataSchema,
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
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
};

type Field = {
    key: string;
    label: string;
    type: string;
    required: boolean;
};

const typeOptions = ["string", "number", "boolean", "date"];

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
        setFields([]);
        setRoleName("");
    };

    const handleAddField = () => {
        setFields([...fields, { key: "", label: "", type: "string", required: false }]);
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleFieldChange = <K extends keyof Field>(index: number, key: K, value: Field[K]) => {
        setFields((prev) => {
            const updated = [...prev];

            updated[index] = { ...updated[index], [key]: value };

            return updated;
        });
    };

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            size="xl"
            onClose={onClose}
        >
            <ModalContent>
                <Form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">Add new role</ModalHeader>
                    <ModalBody className="w-full flex flex-col gap-3">
                        <Input
                            isRequired
                            label="Role Name"
                            placeholder="Enter Role Name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                        />
                        <Card shadow="none">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <p className="text-sm font-semibold">Metadata Fields</p>
                                <Button color="primary" size="sm" variant="light" onPress={handleAddField}>
                                    + Add Field
                                </Button>
                            </CardHeader>
                            {fields.map((field, index) => (
                                <div key={index} className="flex flex-row gap-2 items-end">
                                    <Input
                                        className="flex-1"
                                        label="Label"
                                        placeholder="e.g., Major"
                                        value={field.label}
                                        variant="underlined"
                                        onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                                    />
                                    <Select
                                        className="flex-1"
                                        label="Type"
                                        selectedKeys={new Set([field.type])}
                                        variant="underlined"
                                        onSelectionChange={(val) => {
                                            const selected = Array.from(val)[0] as string;

                                            handleFieldChange(index, "type", selected);
                                        }}
                                    >
                                        {typeOptions.map((t) => (
                                            <SelectItem key={t}>{t}</SelectItem>
                                        ))}
                                    </Select>
                                    <div className="flex gap-2 items-center">
                                        <Checkbox
                                            isSelected={field.required}
                                            size="sm"
                                            onValueChange={(val) => handleFieldChange(index, "required", val)}
                                        >
                                            Required
                                        </Checkbox>
                                        <Button
                                            isIconOnly
                                            color="danger"
                                            variant="light"
                                            onPress={() => handleRemoveField(index)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </Card>

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
}

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
    schools: any[];
    majors: any[];
    users: any[];
};

type Field = {
    key: string;
    label: string;
    type: string;
    required: boolean;
};

const typeOptions = ["string", "number", "boolean", "date"];

export default function AddRoleModal({ isOpen, onClose, onAddRole, schools, majors, users }: AddRoleProps) {
    const [fields, setFields] = useState<Field[]>([]);
    const [roleName, setRoleName] = useState<string>("");
    const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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
            ...(selectedMajors.length > 0 && { selectedMajors }),
            ...(selectedSchools.length > 0 && { selectedSchools }),
            ...(selectedUsers.length > 0 && { selectedUsers })
        };


        onAddRole(formData);
        setFields([]);
        setRoleName("");
        setSelectedMajors([]);
        setSelectedSchools([]);
        setSelectedUsers([]);
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

    const getOptionsForKey = (key: string) => {
        switch (key) {
            case 'school': return schools || [];
            case 'major': return majors || [];
            case 'user': return users || [];
            default: return [];
        }
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

                                               {/* Metadata Select Fields Card */}
                                               <Card shadow="none">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <p className="text-sm font-semibold">Metadata Select Fields</p>
                            </CardHeader>
                            
                            <div className="p-4 space-y-4">
                                {/* Major Selection */}
                                <div className="flex flex-row gap-2 items-end">
                                    <Input
                                        className="w-32"
                                        label="Field"
                                        value="major"
                                        variant="underlined"
                                        isReadOnly
                                    />
                                    <Select
                                        className="flex-1"
                                        label="Select Major(s)"
                                        placeholder="Choose majors..."
                                        selectionMode="multiple"
                                        variant="underlined"
                                        selectedKeys={new Set(selectedMajors)}
                                        onSelectionChange={(val) => {
                                            const selected = Array.from(val) as string[];
                                            setSelectedMajors(selected);
                                        }}
                                    >
                                        {majors.map((major: any) => (
                                            <SelectItem key={major.id}>
                                                {major.name.th}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* School Selection */}
                                <div className="flex flex-row gap-2 items-end">
                                    <Input
                                        className="w-32"
                                        label="Field"
                                        value="school"
                                        variant="underlined"
                                        isReadOnly
                                    />
                                    <Select
                                        className="flex-1"
                                        label="Select School(s)"
                                        placeholder="Choose schools..."
                                        selectionMode="multiple"
                                        variant="underlined"
                                        selectedKeys={new Set(selectedSchools)}
                                        onSelectionChange={(val) => {
                                            const selected = Array.from(val) as string[];
                                            setSelectedSchools(selected);
                                        }}
                                    >
                                        {schools.map((school: any) => (
                                            <SelectItem key={school.id}>
                                                {school.name.en}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* User Selection */}
                                <div className="flex flex-row gap-2 items-end">
                                    <Input
                                        className="w-32"
                                        label="Field"
                                        value="user"
                                        variant="underlined"
                                        isReadOnly
                                    />
                                    <Select
                                        className="flex-1"
                                        label="Select User(s)"
                                        placeholder="Choose users..."
                                        selectionMode="multiple"
                                        variant="underlined"
                                        selectedKeys={new Set(selectedUsers)}
                                        onSelectionChange={(val) => {
                                            const selected = Array.from(val) as string[];
                                            setSelectedUsers(selected);
                                        }}
                                    >
                                        {users.map((user: any) => (
                                            <SelectItem key={user.id}>
                                                {user.name.en}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
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

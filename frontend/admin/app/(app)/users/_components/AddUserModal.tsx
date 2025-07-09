import React, { FormEvent, useEffect, useState } from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";

import { User } from "@/types/user";
import { School } from "@/types/school";
import { Major } from "@/types/major";

type UserForm = {
    name: {
        first: string,
        middle: string,
        last: string,
    },
    username: string,
    role: string,
    metadata: {
        major: string
    }
}

type AddModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (user: Partial<User>, userAction: User) => void;
    action: "Add" | "Edit";
    user: Partial<User>;
    roleId: string;
    schools: School[];
    majors: Major[];
    userAction: User;
};

export default function AddModal({ isOpen, onClose, onAdd, action, user, roleId, schools, majors, userAction }: AddModalProps) {
    const resetField: UserForm = {
        name: {
            first: "",
            middle: "",
            last: "",
        },
        username: "",
        role: "",
        metadata: {
            major: ""
        }
    };
    const [field, setField] = useState<UserForm>(resetField);
    const [school, setSchool] = useState<Set<string>>(new Set<string>());
    const [major, setMajor] = useState<Set<string>>(new Set<string>());

    const majorData = majors.find(m => m.name.en === Array.from(major)[0]);

    useEffect(() => {
        if (action === "Add") {
            setField(resetField);
            setField(prev => ({ ...prev, role: roleId }))
        }
        if (action === "Edit" && typeof user.metadata?.major === "object") {
            setField({
                name: {
                    first: user.name?.first!,
                    middle: user.name?.middle ?? "",
                    last: user.name?.last ?? "",
                },
                username: user.username!,
                role: roleId,
                metadata: {
                    major: user.metadata?.major?._id ?? ""
                }
            });
            setSchool(typeof user.metadata.major.school === "object" ? new Set([user.metadata.major.school.name.en]) : new Set());
            setMajor(new Set([user.metadata.major.name.en]));
        }
    }, [isOpen, user, action]);

    const handleClose = () => {
        setField(resetField);
        onClose();
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData: Partial<User> = {
            name: field.name,
            username: field.username,
            role: field.role,
            metadata: {
                major: majorData?._id ?? ""
            }
        };

        onAdd(formData, userAction);
    };

    return (
        <>
            <Modal
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                isOpen={isOpen}
                onClose={handleClose}
            >
                <ModalContent>
                    <Form
                        className="w-full"
                        onSubmit={(e) => handleSubmit(e)}
                    >
                        <ModalHeader className="flex flex-col gap-1">{action === "Add" ? "Add new user" : "Edit user"}</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your student ID" }
                                }
                                label="Student ID"
                                placeholder="Enter Student ID"
                                type="string"
                                value={field.username}
                                onChange={(e) => setField(prev => ({ ...prev, username: e.target.value }))}
                            />
                            <Input
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your first name" }
                                }
                                label="First Name"
                                placeholder="Enter First Name"
                                type="string"
                                value={field.name.first}
                                onChange={(e) => setField(prev => ({ ...prev, name: { ...prev.name, first: e.target.value } }))}
                            />
                            <Input
                                label="Middle Name"
                                placeholder="Enter Middle Name"
                                type="string"
                                value={field.name.middle}
                                onChange={(e) => setField(prev => ({ ...prev, name: { ...prev.name, middle: e.target.value } }))}
                            />
                            <Input
                                label="Last Name"
                                placeholder="Enter Last Name"
                                type="string"
                                value={field.name.last}
                                onChange={(e) => setField(prev => ({ ...prev, name: { ...prev.name, last: e.target.value } }))}
                            />
                            <Select
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your school" }
                                }
                                label="School"
                                placeholder="Select School"
                                selectedKeys={school}
                                onSelectionChange={(keys) => setSchool(keys as Set<string>)}
                            >
                                {schools.map((s) => (
                                    <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your major" }
                                }
                                label="Major"
                                placeholder="Select Major"
                                selectedKeys={major}
                                onSelectionChange={(keys) => setMajor(keys as Set<string>)}
                            >
                                {(majors.filter((major) => (typeof major.school === "object" ? major.school.name.en : "") === Array.from(school)[0])).map((m) => (
                                    <SelectItem key={m.name.en}>{m.name.en}</SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter className="self-end">
                            <Button
                                color="danger"
                                variant="light"
                                onPress={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button color="primary" type="submit">
                                Confirm
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalContent>
            </Modal>
        </>
    )
}
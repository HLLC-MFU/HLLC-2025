import React from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";

import { User } from "@/types/user";
import { School } from "@/types/school";

export interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (user: Partial<User>) => void;
    action: "Add" | "Edit";
    user: Partial<User>;
    roleId: string;
    schools: School[];
};

export default function AddModal({ isOpen, onClose, onAdd, action, user, roleId, schools }: AddModalProps) {

    const [username, setUsername] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [middleName, setMiddleName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [school, setSchool] = React.useState<Set<string>>(new Set<string>());
    const [major, setMajor] = React.useState<Set<string>>(new Set<string>());

    React.useEffect(() => {
        if (action === "Edit") {
            setUsername(user.username ?? "");
            setFirstName(user.name?.first ?? "");
            setMiddleName(user.name?.middle ?? "");
            setLastName(user.name?.last ?? "");
            setSchool(new Set([user.metadata?.major.school.name.en]));
            setMajor(new Set([user.metadata?.major.name.en]));
        }
        if (action === "Add") {
            onClear();
        }
    }, [isOpen, user, action]);

    const onClear = () => {
        setUsername("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setSchool(new Set<string>());
        setMajor(new Set<string>());
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let majorId = "";

        schools.map((s) => {
            if (s.name.en === Array.from(school)[0]) {
                s.majors.map((m) => {
                    if (m.name.en === Array.from(major)[0] && m._id) majorId = m._id;
                })
            }
        })

        const formData: Partial<User> = {
            name: {
                first: firstName,
                middle: middleName,
                last: lastName,
            },
            username: username,
            role: roleId,
            metadata: {
                major: majorId
            }
        };

        console.log(formData);

        if (action === "Add") {
            onAdd(formData);
        } else if (action === "Edit") {
            onAdd(formData);
        } else {
            console.error("Fail to submit data");
        }
    };

    return (
        <>
            <Modal
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                isOpen={isOpen}
                onClose={() => { onClose(); onClear(); }}
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
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <Input
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your first name" }
                                }
                                label="First Name"
                                placeholder="Enter First Name"
                                type="string"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <Input
                                label="Middle Name"
                                placeholder="Enter Middle Name"
                                type="string"
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                            />
                            <Input
                                isRequired
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your last name" }
                                }
                                label="Last Name"
                                placeholder="Enter Last Name"
                                type="string"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
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
                                {(schools.find((s) => s.name.en === Array.from(school)[0])?.majors || []).map((m) => (
                                    <SelectItem key={m.name.en}>{m.name.en}</SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter className="self-end">
                            <Button color="danger" variant="light" onPress={() => { onClose(); onClear(); }}>
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
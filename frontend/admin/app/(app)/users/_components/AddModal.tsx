import React from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";

import { User } from "@/types/user";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json"
export const schools = schoolsMockup;

export interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (user: Partial<User>) => void;
    roleId: string;
    action: "Add" | "Edit";
    user: Partial<User>;
};

export default function AddModal({ isOpen, onClose, onAdd, roleId, action, user }: AddModalProps) {
    const [username, setUsername] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [middleName, setMiddleName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [school, setSchool] = React.useState<Set<string>>(new Set<string>());
    const [major, setMajor] = React.useState<Set<string>>(new Set<string>());
    const majorId = React.useRef<string>("");

    React.useEffect(() => {
        if (action === "Edit") {
            setUsername(user.username ?? "");
            setFirstName(user.name?.first ?? "");
            setMiddleName(user.name?.middle ?? "");
            setLastName(user.name?.last ?? "");
            schools.map((school) => {
                if (school.name.en === user.metadata?.school?.name.en) {
                    setSchool(new Set([school.name.en]));
                    {
                        school.majors.map((major) => {
                            if (major.name.en === user.metadata?.major?.name.en) {
                                setMajor(new Set([major.name.en]));
                            }
                        })
                    }
                }
            })
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

        schools.map((s) => {
            if (s.name.en === [...school][0]) {
                s.majors.map((m) => {
                    if (m.name.en === [...major][0]) {
                        majorId.current = m.id;
                    }
                });
            }
        })

        const formData: Partial<User> = {
            name: {
                first: firstName,
                middle: middleName,
                last: lastName,
            },
            username: username,
            role: {
                _id: roleId
            },
            major: majorId.current,
            metadata: {
                major: Array.from(major)[0],
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
                                label="Student ID"
                                type="string"
                                placeholder="Enter Student ID"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your student ID" }
                                }
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="First Name"
                                type="string"
                                placeholder="Enter First Name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your first name" }
                                }
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <Input
                                label="Middle Name"
                                type="string"
                                placeholder="Enter Middle Name"
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="Last Name"
                                type="string"
                                placeholder="Enter Last Name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your last name" }
                                }
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                            <Select
                                isRequired
                                label="School"
                                placeholder="Select School"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your school" }
                                }
                                selectedKeys={school}
                                onSelectionChange={(keys) => setSchool(keys as Set<string>)}
                            >
                                {schools.map((s) => (
                                    <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                isRequired
                                label="Major"
                                placeholder="Select Major"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your major" }
                                }
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
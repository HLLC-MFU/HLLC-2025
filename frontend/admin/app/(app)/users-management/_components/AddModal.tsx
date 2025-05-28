import React from "react";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json"
import { User } from "@/types/user";

export const schools = schoolsMockup;

export interface AddModalProps {
    title: "Add" | "Edit";
    isOpen: boolean;
    onClose: () => void;
    data: User;
    onAddUser: (userData: Partial<User>) => void;
};

export default function AddModal({ title, isOpen, onClose, data, onAddUser }: AddModalProps) {
    const [studentIdValue, setStudentIdValue] = React.useState("");
    const [firstNameValue, setFirstNameValue] = React.useState("");
    const [middleNameValue, setMiddleNameValue] = React.useState("");
    const [lastNameValue, setLastNameValue] = React.useState("");
    const [schoolValue, setSchoolValue] = React.useState<Set<string>>(new Set<string>());
    const [majorValue, setMajorValue] = React.useState<Set<string>>(new Set<string>());
    const majorId = React.useRef<string>("");

    React.useEffect(() => {
        if (title === "Edit") {
            setStudentIdValue(data.username);
            setFirstNameValue(data.name.first);
            setMiddleNameValue(data.name.middle || "");
            setLastNameValue(data.name.last);
            schools.map((school) => {
                if (school.name.en === data.metadata?.school?.name.en) {
                    setSchoolValue(new Set([school.name.en]));
                    {
                        school.majors.map((major) => {
                            if (major.name.en === data.metadata?.major?.name.en) {
                                setMajorValue(new Set([major.name.en]));
                            }
                        })
                    }
                }
            })
        }
        if (title === "Add") {
            onClear();
        }
    }, [data, title]);

    const onClear = () => {
        setStudentIdValue("");
        setFirstNameValue("");
        setMiddleNameValue("");
        setLastNameValue("");
        setSchoolValue(new Set<string>());
        setMajorValue(new Set<string>());
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        schools.map((school) => {
            if (school.name.en === [...schoolValue][0]) {
                {
                    school.majors.map((major) => {
                        if (major.name.en === [...majorValue][0]) {
                            majorId.current = major;
                        }
                    });
                }
            }
        })

        const formData: Partial<User> = {
            name: {
                first: firstNameValue,
                middle: middleNameValue,
                last: lastNameValue,
            },
            username: studentIdValue,
            // Mockup student role
            role: "6836c4413f987112cc4bca1f",
            metadata: {
                major: majorId.current?.id,
            }
        };

        if (title === "Add") {
            onAddUser(formData);
        } else if (title === "Edit") {
            onAddUser(formData);
        } else {
            console.error("Fail to submit data");
        }

        onClear();
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
                        <ModalHeader className="flex flex-col gap-1">{title === "Add" ? "Add new file" : "Edit file"}</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                label="Student ID"
                                type="string"
                                placeholder="Enter Student ID"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your student ID" }
                                }
                                value={studentIdValue}
                                onChange={(e) => setStudentIdValue(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="First Name"
                                type="string"
                                placeholder="Enter First Name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your first name" }
                                }
                                value={firstNameValue}
                                onChange={(e) => setFirstNameValue(e.target.value)}
                            />
                            <Input
                                label="Middle Name"
                                type="string"
                                placeholder="Enter Middle Name"
                                value={middleNameValue}
                                onChange={(e) => setMiddleNameValue(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="Last Name"
                                type="string"
                                placeholder="Enter Last Name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your last name" }
                                }
                                value={lastNameValue}
                                onChange={(e) => setLastNameValue(e.target.value)}
                            />
                            <Select
                                isRequired
                                label="School"
                                placeholder="Select School"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your school" }
                                }
                                selectedKeys={schoolValue}
                                onSelectionChange={(keys) => setSchoolValue(keys as Set<string>)}
                            >
                                {schools.map((school) => (
                                    <SelectItem key={school.name.en}>{school.name.en}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Major"
                                placeholder="Select Major"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your major" }
                                }
                                selectedKeys={majorValue}
                                onSelectionChange={(keys) => setMajorValue(keys as Set<string>)}
                            >
                                {(schools.find((school) => school.name.en === Array.from(schoolValue)[0])?.majors || []).map((major) => (
                                    <SelectItem key={major.name.en}>{major.name.en}</SelectItem>
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
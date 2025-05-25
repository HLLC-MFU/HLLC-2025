import React from "react";
import { addToast, Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@heroui/react";

export const schools = [
    {
        name: "School of Agro-Industry",
        majors: [
            "Food Science and Technology",
            "Agro-Industry",
            "Postharvest Technology",
        ],
    },
    {
        name: "School of Cosmetic Science",
        majors: [
            "Beauty and Cosmetic Science",
            "Health and Beauty Innovation",
        ],
    },
    {
        name: "School of Information Technology",
        majors: [
            "Information Technology",
            "Computer Science",
            "Data Science and AI",
        ],
    },
    {
        name: "School of Management",
        majors: [
            "Business Administration",
            "Logistics and Supply Chain Management",
            "International Business Management",
        ],
    },
    {
        name: "School of Science",
        majors: [
            "Applied Chemistry",
            "Biological Science",
            "Environmental Science",
        ],
    },
    {
        name: "School of Medicine",
        majors: [
            "Doctor of Medicine (M.D.)",
        ],
    },
    {
        name: "School of Liberal Arts",
        majors: [
            "English for Professional Communication",
            "Chinese Language and Culture",
            "Thai Language for Foreigners",
        ],
    },
];

interface FileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
};

export default function FileModal({ isOpen, onClose, onSubmit }: FileModalProps) {
    const [studentIdValue, setStudentIdValue] = React.useState("");
    const [firstNameValue, setFirstNameValue] = React.useState("");
    const [middleNameValue, setMiddleNameValue] = React.useState("");
    const [lastNameValue, setLastNameValue] = React.useState("");
    const [schoolValue, setSchoolValue] = React.useState("");
    const [majorValue, setMajorValue] = React.useState("");

    const handleClose = () => {
        setStudentIdValue("");
        setFirstNameValue("");
        setMiddleNameValue("");
        setLastNameValue("");
        setSchoolValue("");
        setMajorValue("");
        onClose();
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            studentId: studentIdValue,
            firstName: firstNameValue,
            middleName: middleNameValue,
            lastName: lastNameValue,
            school: Array.from(schoolValue)[0],
            major: Array.from(majorValue)[0],
        };
        onSubmit(data);
        handleClose();
        addToast({ 
            title: "Add Successful", 
            description: "User has been added successfully", 
            color: "success",
            variant: "solid",
            classNames: {
                base: "text-white",
                title: "text-white",
                description: "text-white",
            },
        });
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
                        <ModalHeader className="flex flex-col gap-1">Add new file</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                label="Student ID"
                                type="number"
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
                                onSelectionChange={(keys) => setSchoolValue(keys as string)}
                            >
                                {schools.map((school) => (
                                    <SelectItem key={school.name}>{school.name}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                isRequired
                                label="Major"
                                placeholder="Select Major"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select your major" }
                                }
                                selectedKeys={majorValue}
                                onSelectionChange={(keys) => setMajorValue(keys as string)}
                            >
                                {(schools.find((school) => school.name === Array.from(schoolValue)[0])?.majors || []).map((major) => (
                                    <SelectItem key={major}>{major}</SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter className="self-end">
                            <Button color="danger" variant="light" onPress={handleClose}>
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
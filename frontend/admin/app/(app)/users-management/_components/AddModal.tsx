import React from "react";
import { addToast, Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@heroui/react";
import { UserProps } from "../admin/page";

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

export interface AddModalProps {
    title: "Add" | "Edit";
    isOpen: boolean;
    onClose: () => void;
    data: UserProps[];
};

export default function AddModal({ title, isOpen, onClose, data, }: AddModalProps) {
    const [studentIdValue, setStudentIdValue] = React.useState(0);
    const [firstNameValue, setFirstNameValue] = React.useState("");
    const [middleNameValue, setMiddleNameValue] = React.useState("");
    const [lastNameValue, setLastNameValue] = React.useState("");
    const [schoolValue, setSchoolValue] = React.useState<Set<string>>(new Set<string>());
    const [majorValue, setMajorValue] = React.useState<Set<string>>(new Set<string>());

    React.useEffect(() => {
        if (title === "Edit") {
            setStudentIdValue(data[0].id);
            setFirstNameValue(data[0].name);
            setMiddleNameValue(data[0].email);
            setLastNameValue(data[0].age);

            // Mockup data for school and major
            {
                schools.map((school) => {
                    // if (school.name === data[0].school) {
                    if (school.name === "School of Liberal Arts") {
                        setSchoolValue(new Set([school.name]));
                        {
                            school.majors.map((major) => {
                                // if (major === data[0].major) {
                                if (major === "English for Professional Communication") {
                                    setMajorValue(new Set([major]));
                                }
                            })
                        };
                    }
                })
            }
        }
        if (title === "Add") {
            clearForm();
        }
    }, [data, title]);

    const handleClose = () => {
        clearForm();
        onClose();
    }

    const clearForm = () => {
        setStudentIdValue(0);
        setFirstNameValue("");
        setMiddleNameValue("");
        setLastNameValue("");
        setSchoolValue(new Set<string>());
        setMajorValue(new Set<string>());
    }

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = {
            studentId: studentIdValue,
            firstName: firstNameValue,
            middleName: middleNameValue,
            lastName: lastNameValue,
            school: Array.from(schoolValue)[0],
            major: Array.from(majorValue)[0],
        };
        handleClose();
        AddToast("Add Successful", "New file has been added successfully");
    };

    const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = {
            studentId: studentIdValue,
            firstName: firstNameValue,
            middleName: middleNameValue,
            lastName: lastNameValue,
            school: Array.from(schoolValue)[0],
            major: Array.from(majorValue)[0],
        };
        handleClose();
        AddToast("Edit Successful", "Edit has been edited successfully");
    };

    const AddToast = (title: string, description: string) => {
        addToast({
            title: title,
            description: description,
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
                        onSubmit={(e) => { title === "Add" ? handleAdd(e) : handleEdit(e) }}
                    >
                        <ModalHeader className="flex flex-col gap-1">{title === "Add" ? "Add new file" : "Edit file"}</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                label="Student ID"
                                type="number"
                                placeholder="Enter Student ID"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your student ID" }
                                }
                                value={studentIdValue === 0 ? "" : studentIdValue.toString()}
                                onChange={(e) => setStudentIdValue(Number(e.target.value))}
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
                                onSelectionChange={(keys) => setMajorValue(keys as Set<string>)}
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
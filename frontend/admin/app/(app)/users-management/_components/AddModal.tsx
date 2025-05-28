import React from "react";
import { addToast, Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { UserType } from "@/app/context/UserContext";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json"

export const schools = schoolsMockup;

export interface AddModalProps {
    title: "Add" | "Edit";
    isOpen: boolean;
    onClose: () => void;
    data: UserType;
};

export default function AddModal({ title, isOpen, onClose, data }: AddModalProps) {
    const [studentIdValue, setStudentIdValue] = React.useState("");
    const [firstNameValue, setFirstNameValue] = React.useState("");
    const [middleNameValue, setMiddleNameValue] = React.useState("");
    const [lastNameValue, setLastNameValue] = React.useState("");
    const [schoolValue, setSchoolValue] = React.useState<Set<string>>(new Set<string>());
    const [majorValue, setMajorValue] = React.useState<Set<string>>(new Set<string>());

    React.useEffect(() => {
        if (title === "Edit") {
            setStudentIdValue(data.username);
            setFirstNameValue(data.name.first);
            setMiddleNameValue(data.name.middle || "");
            setLastNameValue(data.name.last);
            schools.map((school) => {
                if (school.name.en === data.metadata.school.name.en) {
                    setSchoolValue(new Set([school.name.en]));
                    {
                        school.majors.map((major) => {
                            if (major.name.en === data.metadata.major?.name.en) {
                                setMajorValue(new Set([major.name.en]));
                            }
                        })
                    };
                }
            })
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
        setStudentIdValue("");
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
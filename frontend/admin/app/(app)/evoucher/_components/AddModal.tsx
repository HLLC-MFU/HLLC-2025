import React from "react";
import { Button, DateInput, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
// import { today, DateValue } from "@internationalized/date";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json"
import { Evoucher } from "@/types/evoucher";

export const schools = schoolsMockup;

export interface AddModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    data: Evoucher;
    handleAdd: (userData: Partial<Evoucher>) => void;
};

export default function AddModal({ title, isOpen, onClose, data, handleAdd }: AddModalProps) {
    const [sponsor, setSponsor] = React.useState("");
    const [acronym, setAcronym] = React.useState("");
    const [detail, setDetail] = React.useState("");
    const [discount, setDiscount] = React.useState<number>(0);
    const [expiration, setExpiration] = React.useState<DateValue | undefined>();
    const [type, setType] = React.useState<Set<string>>(new Set<string>());
    const [cover, setCover] = React.useState("");
    const [banner, setBanner] = React.useState("");
    const [thumpnail, setThumpnail] = React.useState("");
    const [logo, setLogo] = React.useState("");

    React.useEffect(() => {
        if (title === "Edit") {
            setSponsor(data.sponsor.name.en);
            setAcronym(data.acronym);
            setDetail(data.detail.en);
            setDiscount(data.discount);
            setExpiration(data.expiration);
            setType(new Set([data.type.name]))
        }
        if (title === "Add") {
            onClear();
        }
    }, [data, title]);

    const onClear = () => {
        setSponsor("");
        setAcronym("");
        setDetail("");
        setDiscount(0);
        setExpiration(undefined);
        setType(new Set());
    }

    // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();

    //     schools.map((school) => {
    //         if (school.name.en === [...schoolValue][0]) {
    //             {
    //                 school.majors.map((major) => {
    //                     if (major.name.en === [...majorValue][0]) {
    //                         majorId.current = major;
    //                     }
    //                 });
    //             }
    //         }
    //     })

    //     const formData: Partial<User> = {
    //         name: {
    //             first: firstNameValue,
    //             middle: middleNameValue,
    //             last: lastNameValue,
    //         },
    //         username: studentIdValue,
    //         // Mockup student role
    //         role: "6836c4413f987112cc4bca1f",
    //         metadata: {
    //             major: majorId.current?.id,
    //         }
    //     };

    //     if (title === "Add") {
    //         onAddUser(formData);
    //     } else if (title === "Edit") {
    //         onAddUser(formData);
    //     } else {
    //         console.error("Fail to submit data");
    //     }
    // };

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
                        // onSubmit={(e) => handleSubmit(e)}
                    >
                        <ModalHeader className="flex flex-col gap-1">{title === "Add" ? "Add new file" : "Edit file"}</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                label="Sponsor"
                                type="string"
                                placeholder="Enter Sponsor name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter sponsor name" }
                                }
                                value={sponsor}
                                onChange={(e) => setSponsor(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="Acronym"
                                type="string"
                                placeholder="Enter Acronym"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter sponsor acronym" }
                                }
                                value={acronym}
                                onChange={(e) => setAcronym(e.target.value)}
                            />
                            <Input
                                label="Detail"
                                type="string"
                                placeholder="Enter Detail"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter detail" }
                                }
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                            />
                            <Input
                                isRequired
                                label="Discount"
                                type="number"
                                placeholder="Enter Discount"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your discount" }
                                }
                                value={discount.toString()}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                            />
                            <DateInput
                                isRequired
                                label="Expiration"
                                // defaultValue={today("UTC")}
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your expiration" }
                                }
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                            />
                            <Select
                                isRequired
                                label="Type"
                                placeholder="Select Type"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select sponsor type" }
                                }
                                selectedKeys={type}
                                onSelectionChange={(keys) => setType(keys as Set<string>)}
                            >
                                <SelectItem key="Global">Global</SelectItem>
                                <SelectItem key="Individual">Individual</SelectItem>
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
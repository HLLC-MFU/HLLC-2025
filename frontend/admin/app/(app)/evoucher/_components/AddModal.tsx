import React from "react";
import { Button, DateInput, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json"
import { Evoucher } from "@/types/evoucher";
import { Calendar } from "lucide-react";
import { EvoucherType } from "@/types/evoucherType";

export const schools = schoolsMockup;

export interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (evoucherData: Partial<Evoucher>) => void;
    type: EvoucherType[];
    title: string;
};

export default function AddModal({ isOpen, onClose, onAdd, type, title, }: AddModalProps) {
    const [sponsor, setSponsor] = React.useState("");
    const [acronym, setAcronym] = React.useState("");
    const [detail, setDetail] = React.useState("");
    const [discount, setDiscount] = React.useState<number>(0);
    const [expiration, setExpiration] = React.useState<Date>();
    const [selectedType, setSelectedType] = React.useState<Set<string>>(new Set<string>());
    const [cover, setCover] = React.useState("");
    const [banner, setBanner] = React.useState("");
    const [thumpnail, setThumpnail] = React.useState("");
    const [logo, setLogo] = React.useState("");

    React.useEffect(() => {
        if (title === "Edit") {
            // setSponsor(data.sponsor.name.en);
            // setAcronym(data.acronym);
            // setDetail(data.detail.en);
            // setDiscount(data.discount);
            // setExpiration(data.expiration);
            // setType(new Set([data.type.name]))
        }
        if (title === "Add") {
            onClear();
        }
    }, [title]);

    const onClear = () => {
        setSponsor("");
        setAcronym("");
        setDetail("");
        setDiscount(0);
        setExpiration(undefined);
        setSelectedType(new Set());
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // const sponsorId = 
        const typeId = type.find((t) => t.name === Array.from(selectedType)[0])?._id;

        // console.log(sponsorId);

        // const formData: Partial<Evoucher> = {
        //     acronym: acronym,
        //     detail: {
        //         th: detail,
        //         en: detail,
        //     },
        //     discount: discount,
        //     expiration: expiration,
        //     sponsors: sponsorId,
        //     type: typeId,
        //     photo: {

        //     },
        // };

        // console.log(formData);

        // if (title === "Add") {
        //     onAdd(formData);
        // } else if (title === "Edit") {
        //     onAdd(formData);
        // } else {
        //     console.error("Fail to submit data");
        // }
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
                        <ModalHeader className="flex flex-col gap-1">{title === "Add" ? "Add evoucher" : "Edit evoucher"}</ModalHeader>
                        <ModalBody className="w-full">
                            <Input
                                isRequired
                                label="Sponsor"
                                type="string"
                                placeholder="Enter Sponsor name"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter sponsor" }
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
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter acronym" }
                                }
                                value={acronym}
                                onChange={(e) => setAcronym(e.target.value)}
                            />
                            <Input
                                isRequired
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
                            {/* <DateInput
                                isRequired
                                label="Expiration"
                                granularity="second"
                                endContent={<Calendar />}
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please enter your expiration" }
                                }
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                            /> */}
                            <Select
                                isRequired
                                label="Type"
                                placeholder="Select Type"
                                errorMessage={
                                    ({ validationDetails }) => { if (validationDetails.valueMissing) return "Please select sponsor type" }
                                }
                                selectedKeys={selectedType}
                                onSelectionChange={(keys) => setSelectedType(keys as Set<string>)}
                            >
                                {type.map((t) => (
                                    <SelectItem key={t.name}>{t.name}</SelectItem>
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
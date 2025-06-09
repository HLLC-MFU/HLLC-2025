import React from "react";
import {
    Button,
    DateInput,
    Form,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Image,
} from "@heroui/react";
import { Calendar } from "lucide-react";
import { ZonedDateTime, toZoned, now } from "@internationalized/date";

// Mockup data for schools
import schoolsMockup from "@/public/mock/schools.json";
import { Sponsors } from "@/types/sponsors";
import { EvoucherType } from "@/types/evoucher-type";

export const schools = schoolsMockup;

export interface AddEvoucherProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (evoucherData: FormData) => void;
    type: EvoucherType[];
    title: string;
    sponsors: Sponsors[];
}

export default function AddModal({
    isOpen,
    onClose,
    onAdd,
    type,
    title,
    sponsors,
}: AddEvoucherProps) {
    const [sponsor, setSponsor] = React.useState<Set<string>>(new Set<string>());
    const [acronym, setAcronym] = React.useState("");
    const [detail, setDetail] = React.useState("");
    const [discount, setDiscount] = React.useState<number>(0);
    const [expiration, setExpiration] = React.useState<ZonedDateTime | null>(
        toZoned(now("Asia/Bangkok"), "Asia/Bangkok")
    );
    const [selectedType, setSelectedType] = React.useState<Set<string>>(new Set<string>());
    const [cover, setCover] = React.useState<File | null>(null);

    React.useEffect(() => {
        if (title === "Add") {
            onClear();
        }
    }, [title]);

    const onClear = () => {
        setSponsor(new Set());
        setAcronym("");
        setDetail("");
        setDiscount(0);
        setExpiration(toZoned(now("Asia/Bangkok"), "Asia/Bangkok"));
        setSelectedType(new Set());
        setCover(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const sponsorId = sponsors.find((s) => s.name.en === Array.from(sponsor)[0])?._id;
        const typeId = type.find((t) => t.name === Array.from(selectedType)[0])?._id;

        const formData = new FormData();
        formData.append("acronym", acronym);
        formData.append("discount", discount.toString());
        if (expiration) {
            formData.append("expiration", expiration.toDate().toISOString());
        }
        formData.append("detail[th]", detail);
        formData.append("detail[en]", detail);
        if (sponsorId) formData.append("sponsors", sponsorId);
        if (typeId) formData.append("type", typeId);
        if (cover) formData.append("photo[coverPhoto]", cover);

        onAdd(formData);
        onClear();
    };

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            onClose={() => {
                onClose();
                onClear();
            }}
        >
            <ModalContent>
                <Form className="w-full" onSubmit={(e) => handleSubmit(e)}>
                    <ModalHeader className="flex flex-col gap-1">
                        {title === "Add" ? "Add evoucher" : "Edit evoucher"}
                    </ModalHeader>
                    <ModalBody className="w-full">
                        <Select
                            isRequired
                            label="Sponsor"
                            placeholder="Select Sponsor"
                            errorMessage={({ validationDetails }) => {
                                if (validationDetails.valueMissing) return "Please select sponsor";
                            }}
                            selectedKeys={sponsor}
                            onSelectionChange={(keys) => setSponsor(keys as Set<string>)}
                        >
                            {sponsors.map((s) => (
                                <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
                            ))}
                        </Select>
                        <Input
                            isRequired
                            label="Acronym"
                            type="string"
                            placeholder="Enter Acronym"
                            errorMessage={({ validationDetails }) => {
                                if (validationDetails.valueMissing) return "Please enter acronym";
                            }}
                            value={acronym}
                            onChange={(e) => setAcronym(e.target.value)}
                        />
                        <Input
                            isRequired
                            label="Detail"
                            type="string"
                            placeholder="Enter Detail"
                            errorMessage={({ validationDetails }) => {
                                if (validationDetails.valueMissing) return "Please enter detail";
                            }}
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                        />
                        <Input
                            isRequired
                            label="Discount"
                            type="number"
                            placeholder="Enter Discount"
                            errorMessage={({ validationDetails }) => {
                                return "Please enter your discount";
                            }}
                            value={discount !== undefined ? discount.toString() : ""}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                        <DateInput
                            isRequired
                            label="Expiration"
                            granularity="minute"
                            value={expiration}
                            onChange={setExpiration}
                            endContent={<Calendar />}
                            errorMessage={({ validationDetails }) => {
                                if (validationDetails.valueMissing) return "Please enter your expiration";
                            }}
                        />
                        <Select
                            isRequired
                            label="Type"
                            placeholder="Select Type"
                            errorMessage={({ validationDetails }) => {
                                if (validationDetails.valueMissing) return "Please select evoucher type";
                            }}
                            selectedKeys={selectedType}
                            onSelectionChange={(keys) => setSelectedType(keys as Set<string>)}
                        >
                            {type.map((t) => (
                                <SelectItem key={t.name}>{t.name}</SelectItem>
                            ))}
                        </Select>
                        <Input
                            isRequired
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setCover(file);
                                }
                            }}
                        />
                    </ModalBody>
                    <ModalFooter className="self-end">
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                onClose();
                                onClear();
                            }}
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
    );
}

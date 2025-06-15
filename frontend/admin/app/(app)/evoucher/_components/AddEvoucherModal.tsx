import React, { FormEvent, RefObject, useEffect, useState } from "react";
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
    Divider,
} from "@heroui/react";
import { Image, Upload, X } from "lucide-react";
import { fromDate } from "@internationalized/date";

import { EvoucherType } from "@/types/evoucher-type";
import { Evoucher } from "@/types/evoucher";

type FieldProps = {
    sponsor: string,
    acronym: string,
    detail: string,
    discount: number,
    expiration: Date,
    selectedType: Set<string>,
    cover: File | string | null,
}

type AddEvoucherProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (evoucherData: FormData) => void;
    type: EvoucherType[];
    evoucherSelected: Partial<Evoucher>;
    title: string;
    sponsorId: string;
    field: FieldProps;
    setField: (field: FieldProps) => void;
    coverInputRef: RefObject<HTMLInputElement>;
}

const IMAGE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddModal({
    isOpen,
    onClose,
    onAdd,
    type,
    evoucherSelected,
    title,
    sponsorId,
    field,
    setField,
    coverInputRef,
}: AddEvoucherProps) {
    const reader = new FileReader();

    const resetField: FieldProps = {
        sponsor: "",
        acronym: "",
        detail: "",
        discount: 0,
        expiration: new Date(),
        selectedType: new Set<string>(),
        cover: null,
    };

    const [previewImage, setPreviewImage] = useState("");

    useEffect(() => {
        if (title === "Add") {
            setField(resetField);
            setPreviewImage("");
        }
        if (title === "Edit" && typeof evoucherSelected === "object") {
            setField({
                sponsor: "",
                acronym: evoucherSelected.acronym!,
                detail: evoucherSelected.detail?.en!,
                discount: evoucherSelected.discount!,
                expiration: evoucherSelected.expiration ? new Date(evoucherSelected.expiration.toLocaleString("en-Us", { timeZone: "Asia/Bangkok" })) : new Date(),
                selectedType: evoucherSelected.type ? new Set([evoucherSelected.type?.name]) : new Set<string>(),
                cover: evoucherSelected.photo?.coverPhoto ?? null,
            });
        }
    }, [title, evoucherSelected, isOpen]);

    const handleFileChange = (file: File) => {
        if (!file) return;

        reader.onload = () => {
            setPreviewImage(reader.result as string)
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        setPreviewImage("");
        setField(resetField);
        onClose();
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const typeId = type.find((t) => t.name === Array.from(field.selectedType)[0])?._id;

        const formData = new FormData();
        formData.append("acronym", field.acronym);
        formData.append("discount", field.discount.toString());
        if (field.expiration) formData.append("expiration", field.expiration.toISOString());
        formData.append("detail[th]", field.detail);
        formData.append("detail[en]", field.detail);
        formData.append("sponsors", sponsorId);
        if (typeId) formData.append("type", typeId);
        if (field.cover instanceof File) formData.append("photo[coverPhoto]", field.cover);

        onAdd(formData);
    };

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            size="4xl"
            scrollBehavior="inside"
            onClose={handleClose}
        >
            <Form
                className="w-full"
                onSubmit={(e) => handleSubmit(e)}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {title === "Add" ? "Add evoucher" : "Edit evoucher"}
                    </ModalHeader>

                    <Divider />

                    <ModalBody className="w-full">
                        <div className=" grid grid-cols-2 gap-4">
                            <Input
                                isRequired
                                label="Acronym"
                                type="string"
                                placeholder="Enter Acronym"
                                errorMessage={({ validationDetails }) => {
                                    if (validationDetails.valueMissing) return "Please enter acronym";
                                }}
                                value={field.acronym}
                                onChange={(e) => setField({ ...field, acronym: e.target.value })}
                            />
                            <Input
                                isRequired
                                label="Detail"
                                type="string"
                                placeholder="Enter Detail"
                                errorMessage={({ validationDetails }) => {
                                    if (validationDetails.valueMissing) return "Please enter detail";
                                }}
                                value={field.detail}
                                onChange={(e) => setField({ ...field, detail: e.target.value })}
                            />
                            <Input
                                isRequired
                                label="Discount"
                                type="number"
                                placeholder="Enter Discount"
                                errorMessage={({ validationDetails }) => {
                                    if (validationDetails.valueMissing) return "Please enter your discount";
                                }}
                                value={field.discount !== undefined ? field.discount.toString() : ""}
                                onChange={(e) => setField({ ...field, discount: Number(e.target.value) })}
                            />
                            <DateInput
                                isRequired
                                label="Expiration"
                                granularity="minute"
                                errorMessage={({ validationDetails }) => {
                                    if (validationDetails.valueMissing) return "Please enter your expiration";
                                }}
                                value={fromDate(field.expiration, "Asia/Bangkok")}
                                onChange={(val) => setField({ ...field, expiration: val ? val.toDate() : new Date() })}
                            />
                            <Select
                                isRequired
                                label="Type"
                                placeholder="Select Type"
                                errorMessage={({ validationDetails }) => {
                                    if (validationDetails.valueMissing) return "Please select evoucher type";
                                }}
                                selectedKeys={field.selectedType}
                                onSelectionChange={(keys) => setField({ ...field, selectedType: new Set(Array.from(keys as Set<string>)) })}
                            >
                                {type.map((t) => (
                                    <SelectItem key={t.name}>{t.name}</SelectItem>
                                ))}
                            </Select>
                        </div>

                        <Divider />

                        <div className="space-y-2 max-w-[400px]">
                            <h3 className="text-sm font-medium mb-3">Photos</h3>
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-default-700">Cover Photo</h4>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        startContent={<Upload size={14} />}
                                        onPress={() => coverInputRef.current?.click()}
                                    >
                                        Upload
                                    </Button>
                                    {previewImage && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            isIconOnly
                                            onPress={() => {
                                                setField({ ...field, cover: null });
                                                setPreviewImage("");
                                            }}
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="relative aspect-square rounded-xl border border-default-200 bg-default-50 transition-all duration-200 hover:border-primary/50">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        className="w-full h-full object-contain max-w-[400px] bg-white"
                                    />
                                ) : typeof field.cover === "string" ? (
                                    <img
                                        src={`${IMAGE_URL}/uploads/${field.cover}`}
                                        alt="Preview"
                                        className="w-full h-full object-contain max-w-[400px] bg-white"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                                        <Image size={24} />
                                        <span className="text-xs">No image uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Input
                            required={!(title === "Edit" && typeof field.cover === "string")}
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setField({ ...field, cover: file });
                                    handleFileChange(file);
                                }
                            }}
                            className="hidden"
                        />
                    </ModalBody>

                    <Divider />

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
                </ModalContent>
            </Form>
        </Modal>
    );
}
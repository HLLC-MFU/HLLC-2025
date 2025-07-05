"use client";

import { Room, RoomType } from "@/types/chat";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (formData: FormData, mode: "add" | "edit") => void;
    room?: Room;
    mode: "add" | "edit";
}

export function RoomModal({ 
    isOpen,
    onClose, 
    onSuccess, 
    room, 
    mode 
}: RoomModalProps) {
    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [type, setType] = useState<RoomType>(RoomType.NORMAL);
    const [capacity, setCapacity] = useState("");

    useEffect(() => {
        if (room) {
            setNameEn(room.name.en);
            setNameTh(room.name.th);
            setType(room.type);
            setCapacity(room.capacity.toString());
        } else {
            resetFields();
        }
    }, [room]);

    const resetFields = () => {
        setNameEn("");
        setNameTh("");
        setType(RoomType.NORMAL);
        setCapacity("");
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nameEn.trim() || !nameTh.trim() || !capacity.trim()) {
            return;
        }

        const formData = new FormData();
        formData.append("name[en]", nameEn.trim());
        formData.append("name[th]", nameTh.trim());
        formData.append("type", type);
        formData.append("capacity", capacity);

        onSuccess(formData, mode);
        resetFields();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={() => { 
                onClose(); 
                resetFields(); 
            }} 
            size="2xl"
        >
            <Form
                className="w-full"
                onSubmit={handleSubmit}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === "add" ? "Add New Room" : "Edit Room"}
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                isRequired
                                label="Room Name (English)"
                                placeholder="Enter room name in English"
                                value={nameEn}
                                onValueChange={setNameEn}
                            />
                            <Input
                                isRequired
                                label="Room Name (Thai)"
                                placeholder="Enter room name in Thai"
                                value={nameTh}
                                onValueChange={setNameTh}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                isRequired
                                label="Room Type"
                                placeholder="Select room type"
                                selectedKeys={[type]}
                                onSelectionChange={(keys) => {
                                    const selectedType = Array.from(keys)[0] as RoomType;
                                    setType(selectedType);
                                }}
                            >
                                <SelectItem key={RoomType.NORMAL}>
                                    Normal
                                </SelectItem>
                                <SelectItem key={RoomType.READONLY}>
                                    Read Only
                                </SelectItem>
                            </Select>
                            <Input
                                isRequired
                                label="Capacity"
                                placeholder="Enter room capacity"
                                type="number"
                                min="1"
                                value={capacity}
                                onValueChange={setCapacity}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            color="danger" 
                            variant="light" 
                            onPress={() => { 
                                onClose(); 
                                resetFields(); 
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            {mode === "add" ? "Add" : "Save"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    );
}


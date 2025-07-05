"useclient";

import { Room, RoomType } from "@/types/chat";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (room: Partial<Room>, mode: "add" | "edit") => void;
    room?: Room;
    mode: "add" | "edit";
}

export function RoomModal({ 
    isOpen,
    onClose, 
    onSuccess, 
    room, 
    mode }: RoomModalProps) {
    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [type, setType] = useState<RoomType>(RoomType.NORMAL || RoomType.READONLY);
    const [capacity, setCapacity] = useState("");
    const [createdBy, setCreatedBy] = useState("");
    const [memberCount, setMemberCount] = useState("");


    useEffect(() => {
        if (room) {
            setNameEn(room.name.en);
            setNameTh(room.name.th);
            setCapacity(room.capacity.toString());
            setCreatedBy(room.createdBy);
            setMemberCount(room.memberCount.toString());
        } else {
            resetField();
        }
    }, [room]);

    const resetField = () => {
        setNameEn("");
        setNameTh("");
        setCapacity("");
        setCreatedBy("");
        setMemberCount("");
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nameEn.trim() || !nameTh.trim()) return;

        const updatedRoom: Partial<Room> = {
            name: {en: nameEn,th: nameTh},
            type: type,
            capacity: parseInt(capacity),
            ...room,
        };

        onSuccess(updatedRoom, mode);
        resetField();
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { onClose(); resetField(); }} size="2xl">
            <Form
                className="w-full"
                onSubmit={(e) => handleSubmit(e)}
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
                            <Input
                            isRequired
                            label="Capacity"
                            placeholder="Enter room capacity"
                            value={capacity}
                            onValueChange={setCapacity}
                        />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => { onClose(); resetField(); }}>
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


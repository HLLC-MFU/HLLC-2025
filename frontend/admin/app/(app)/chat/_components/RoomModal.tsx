"use client";

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useState, useEffect, FormEvent } from "react";
import { InfinityIcon } from "lucide-react";
import { ImagePreview } from "./ImagePreview";
import { RoomMembersSelector } from "./RoomMembersSelector";
import { Room, RoomType } from "@/types/chat";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";

type RoomModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (formData: FormData, mode: "add" | "edit") => void;
    room?: Room;
    mode: "add" | "edit";
    roomType: RoomType | "school" | "major";
};

export function RoomModal({ isOpen, onClose, onSuccess, room, mode, roomType }: RoomModalProps) {
    const { schools, loading: schoolsLoading } = useSchools();
    const { majors, loading: majorsLoading } = useMajors();
    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [type, setType] = useState<RoomType>(RoomType.NORMAL);
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [capacity, setCapacity] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedMajor, setSelectedMajor] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && room) {
            const { name, type, status, capacity, metadata, members } = room;
            setNameEn(name.en);
            setNameTh(name.th);
            setType(type);
            setStatus(status || "active");
            setCapacity(capacity.toString());
            setSelectedSchool(metadata?.groupType === "school" ? metadata.groupValue : "");
            setSelectedMajor(metadata?.groupType === "major" ? metadata.groupValue : "");
            setSelectedMembers(members || []);
        } else {
            resetFields();
        }
    }, [isOpen, room, roomType]);
    const resetFields = () => {
        setNameEn("");
        setNameTh("");
        setType(RoomType.NORMAL);
        setStatus("active");
        setCapacity("");
        setSelectedSchool("");
        setSelectedMajor("");
        setSelectedMembers([]);
        setSearchQuery("");
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!nameEn.trim() || !nameTh.trim() || !capacity.trim()) return;

        if (roomType === "school" && !selectedSchool) return alert("Please select a school");
        if (roomType === "major" && !selectedMajor) return alert("Please select a major");

        const formData = new FormData();
        formData.append("name.en", nameEn.trim());
        formData.append("name.th", nameTh.trim());
        formData.append("type", type);
        formData.append("status", status);
        formData.append("capacity", capacity);
        
        if (roomType === "school") {
            formData.append("groupType", "school");
            formData.append("groupValue", selectedSchool);
        } else if (roomType === "major") {
            formData.append("groupType", "major");
            formData.append("groupValue", selectedMajor);
        }

        if (selectedMembers.length > 0) {
            if (selectedMembers.includes("SELECT_ALL")) formData.append("selectAllUsers", "true");
            else selectedMembers.forEach((id, idx) => formData.append(`members[${idx}]`, id));
        }

        if (image) formData.append("image", image);
        onSuccess(formData, mode);
        resetFields();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setImage(file);
            const reader = new FileReader();

            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal isOpen={isOpen} size="2xl" onClose={() => { onClose(); resetFields(); }}>
            <Form className="w-full" onSubmit={handleSubmit}>
                <ModalContent>
                    <ModalHeader>{`${mode === "add" ? "Add" : "Edit"} ${roomType === "school" ? "School" : roomType === "major" ? "Major" : "Room"}`}</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Room Name (English)" value={nameEn} onValueChange={setNameEn} />
                            <Input label="Room Name (Thai)" value={nameTh} onValueChange={setNameTh} />
                        </div>

                        <Select label="Status*" selectedKeys={new Set([status])} onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as "active" | "inactive")}>
                            <SelectItem key="active" className="text-green-600">Active</SelectItem>
                            <SelectItem key="inactive" className="text-red-600">Inactive</SelectItem>
                        </Select>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Capacity*" min={0} type="number" value={capacity} onValueChange={setCapacity} />
                            <div className="flex items-center gap-2 text-sm font-bold text-primary-600 mt-1">
                                <InfinityIcon className="w-5 h-5 text-blue-500" />
                                <span className="text-blue-600">Set to 0 for unlimited capacity</span>
                            </div>
                        </div>

                        {(roomType === "school" || roomType === "major") && (
                            <Select label="Room Type" selectedKeys={[type]} onSelectionChange={(keys) => setType(Array.from(keys)[0] as RoomType)}>
                                <SelectItem key={RoomType.NORMAL}>Normal</SelectItem>
                                <SelectItem key={RoomType.READONLY}>Read Only</SelectItem>
                            </Select>
                        )}

                        {roomType === "school" && (
                            <Select isLoading={schoolsLoading} label="Select School" selectedKeys={selectedSchool ? [selectedSchool] : []} onSelectionChange={(keys) => setSelectedSchool(Array.from(keys)[0] as string)}>
                                {schools.map(school => <SelectItem key={school._id}>{school.name.en}</SelectItem>)}
                            </Select>
                        )}

                        {roomType === "major" && (
                            <Select isLoading={majorsLoading} label="Select Major" selectedKeys={selectedMajor ? [selectedMajor] : []} onSelectionChange={(keys) => setSelectedMajor(Array.from(keys)[0] as string)}>
                                {majors.map(major => <SelectItem key={major._id}>{major.name.en}</SelectItem>)}
                            </Select>
                        )}

                        <RoomMembersSelector selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} />
                        <Input accept="image/*" label="Room Image (Optional)" type="file" onChange={handleImageChange} />
                        <ImagePreview imagePreview={imagePreview} onRemove={() => { setImage(null); setImagePreview(null); }} />
                    </ModalBody>

                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => { onClose(); resetFields(); }}>Cancel</Button>
                        <Button color="primary" type="submit">{mode === "add" ? "Add" : "Save"}</Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    );
}

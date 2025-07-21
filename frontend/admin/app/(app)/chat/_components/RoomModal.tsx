"use client";

import type { Room, RoomType, RoomSchedule } from "@/types/room";
import type { User } from "@/types/user";

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useState, useEffect, FormEvent } from "react";
import { InfinityIcon } from "lucide-react";

import { ImagePreview } from "./ImagePreview";
import { RoomMembersSelector } from "./RoomMembersSelector";
import { RoomScheduleSelector } from "./RoomScheduleSelector";

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
    const [type, setType] = useState<RoomType>("normal");
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [capacity, setCapacity] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedMajor, setSelectedMajor] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<RoomSchedule | null>(null);

    useEffect(() => {
        if (isOpen && room) {
            setNameEn(room.name.en);
            setNameTh(room.name.th);
            setType(room.type);
            setStatus(room.status || "active");
            setCapacity(room.capacity.toString());
            setSelectedSchool(room.metadata?.groupType === "school" ? room.metadata.groupValue || "" : "");
            setSelectedMajor(room.metadata?.groupType === "major" ? room.metadata.groupValue || "" : "");
            setSchedule(room.schedule || null);
            setSelectedMembers([]);
        } else {
            setNameEn("");
            setNameTh("");
            setStatus("active");
            setCapacity("");
            setSelectedSchool("");
            setSelectedMajor("");
            setSelectedMembers([]);
            setImage(null);
            setImagePreview(null);
            setSchedule(null);
            // set type ตาม roomType เฉพาะตอน add
            if (roomType === "normal" || roomType === "readonly") {
                setType(roomType);
            } else {
                setType("normal");
            }
        }
    }, [isOpen, room, roomType]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!nameEn.trim() || !nameTh.trim() || !capacity.trim()) {
            return;
        }

        if (roomType === "school" && !selectedSchool) {
            return;
        }

        if (roomType === "major" && !selectedMajor) {
            return;
        }

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
            if (selectedMembers.some(u => u._id === "__SELECT_ALL__")) {
                formData.append("selectAllUsers", "true");
            } else {
                selectedMembers.forEach((user, idx) => {
                    formData.append(`members[${idx}]`, user._id);
                });
            }
        }

        if (image) {
            formData.append("image", image);
        }
        
        if (schedule && (schedule.startAt || schedule.endAt)) {
            if (schedule.startAt) formData.append("scheduleStartAt", schedule.startAt);
            if (schedule.endAt) formData.append("scheduleEndAt", schedule.endAt);
        }
        
        onSuccess(formData, mode);
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

    const isFormValid = nameEn.trim() && nameTh.trim() && capacity.trim() &&
        ((roomType !== "school" && roomType !== "major") ||
         (roomType === "school" && selectedSchool) ||
         (roomType === "major" && selectedMajor));

    return (
        <Modal isDismissable={false} isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
            <Form onSubmit={handleSubmit}>
                <ModalContent>
                    <ModalHeader>
                        {`${mode === "add" ? "Add" : "Edit"} ${roomType === "school" ? "School" : roomType === "major" ? "Major" : "Room"}`}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
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
                                    placeholder="กรอกชื่อห้องเป็นภาษาไทย"
                                    value={nameTh}
                                    onValueChange={setNameTh}
                                />
                            </div>

                            <Select 
                                label="Status" 
                                selectedKeys={[status]} 
                                onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as "active" | "inactive")}
                            >
                                <SelectItem key="active">Active</SelectItem>
                                <SelectItem key="inactive">Inactive</SelectItem>
                            </Select>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    isRequired
                                    label="Capacity"
                                    placeholder="0 = unlimited"
                                    type="number"
                                    value={capacity}
                                    onValueChange={setCapacity}
                                />
                                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                                    <InfinityIcon className="w-5 h-5" />
                                    <span>Set to 0 for unlimited capacity</span>
                                </div>
                            </div>

                            {/* Room Type dropdown เฉพาะ school/major เท่านั้น */}
                            {(roomType === "school" || roomType === "major") && (
                                <Select 
                                    label="Room Type" 
                                    selectedKeys={[type]} 
                                    onSelectionChange={(keys) => setType(Array.from(keys)[0] as RoomType)}
                                >
                                    <SelectItem key="normal">Normal</SelectItem>
                                    <SelectItem key="readonly">Read Only</SelectItem>
                                </Select>
                            )}

                            {roomType === "school" && (
                                <Select 
                                    isRequired 
                                    isLoading={schoolsLoading}
                                    label="Select School" 
                                    selectedKeys={selectedSchool ? [selectedSchool] : []}
                                    onSelectionChange={(keys) => setSelectedSchool(Array.from(keys)[0] as string)}
                                >
                                    {schools.map(school => (
                                        <SelectItem key={school._id}>{school.name.en}</SelectItem>
                                    ))}
                                </Select>
                            )}

                            {roomType === "major" && (
                                <Select 
                                    isRequired 
                                    isLoading={majorsLoading}
                                    label="Select Major" 
                                    selectedKeys={selectedMajor ? [selectedMajor] : []}
                                    onSelectionChange={(keys) => setSelectedMajor(Array.from(keys)[0] as string)}
                                >
                                    {majors.map(major => (
                                        <SelectItem key={major._id}>{major.name.en}</SelectItem>
                                    ))}
                                </Select>
                            )}

                            <RoomMembersSelector 
                                allowSelectAll={roomType !== 'school' && roomType !== 'major'} 
                                selectedMembers={selectedMembers} 
                                setSelectedMembers={setSelectedMembers}
                            />

                            <Input 
                                accept="image/*" 
                                label="Room Image (Optional)" 
                                type="file" 
                                onChange={handleImageChange} 
                            />
                            
                            {imagePreview && (
                                <ImagePreview 
                                    imagePreview={imagePreview} 
                                    onRemove={() => { setImage(null); setImagePreview(null); }} 
                                />
                            )}

                            <RoomScheduleSelector
                                schedule={schedule}
                                onChange={setSchedule}
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" color="primary" isDisabled={!isFormValid} type="submit">
                            {mode === "add" ? "Add" : "Save"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    );
}

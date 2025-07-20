"use client";

import type { Room, RoomType } from "@/types/room";
import type { User } from "@/types/user";

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useState, useEffect, FormEvent } from "react";
import { InfinityIcon } from "lucide-react";


import { RoomMembersSelector } from "./RoomMembersSelector";

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
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (isOpen && room) {
            setNameEn(room.name.en);
            setNameTh(room.name.th);
            setType(room.type);
            setStatus(room.status || "active");
            setCapacity(room.capacity.toString());
            setSelectedSchool(room.metadata?.groupType === "school" ? room.metadata.groupValue || "" : "");
            setSelectedMajor(room.metadata?.groupType === "major" ? room.metadata.groupValue || "" : "");
            setSelectedMembers([]);
            
            // แก้ไขปัญหารูปภาพ - ใช้ URL ที่ถูกต้อง
            if (room.image) {
                const imageUrl = `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${room.image}`;
                setImagePreview(imageUrl);
                setImage(null); // ไม่ต้อง set file เพราะเป็น URL
            } else {
                setImagePreview(null);
                setImage(null);
            }
            setImageError(false);
        } else {
            // Reset ทุกอย่างเมื่อเปิด modal ใหม่
            setNameEn("");
            setNameTh("");
            setStatus("active");
            setCapacity("");
            setSelectedSchool("");
            setSelectedMajor("");
            setSelectedMembers([]);
            setImage(null);
            setImagePreview(null);
            setImageError(false);
            
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

                            {/* Enhanced Image Upload Section */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-700">Room Image (Optional)</label>
                                
                                <div className="flex items-start gap-6">
                                    {/* Current Image Preview */}
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Room preview"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-8 h-8 mx-auto mb-1 text-gray-400">
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs text-gray-500">No image</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="flex-1 space-y-3">
                                        <Input 
                                            accept="image/*" 
                                            label="Choose new image" 
                                            type="file" 
                                            onChange={handleImageChange}
                                            classNames={{
                                                label: "text-sm font-medium",
                                                inputWrapper: "border-gray-200 hover:border-gray-300"
                                            }}
                                        />
                                        
                                        {imagePreview && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    onPress={() => { 
                                                        setImage(null); 
                                                        setImagePreview(null); 
                                                        setImageError(false);
                                                    }}
                                                >
                                                    Remove Image
                                                </Button>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-500">
                                            Recommended: Square image, max 2MB. Supports JPG, PNG, GIF.
                                        </p>
                                    </div>
                                </div>
                            </div>
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

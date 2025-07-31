"use client";

import type { Room, RoomType, RoomMember } from "@/types/room";
import type { User } from "@/types/user";

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, addToast } from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import { InfinityIcon } from "lucide-react";
import { Modal as Dialog } from "@heroui/react";

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
    getRoomMembers: (roomId: string) => Promise<any>;
    getRoomMembersOnly: (roomId: string) => Promise<any>;
};

export function RoomModal({ isOpen, onClose, onSuccess, room, mode, roomType, getRoomMembers, getRoomMembersOnly }: RoomModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
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
    const [showImageSizeDialog, setShowImageSizeDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Memoize room ID to prevent unnecessary re-renders
    const roomId = room?._id;

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

            if (room.image) {
                const imageUrl = `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${room.image}`;
                setImagePreview(imageUrl);
                setImage(null); 
            } else {
                setImagePreview(null);
                setImage(null);
            }
            setImageError(false);
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
            setImageError(false);

            if (["normal", "readonly", "mc"].includes(roomType)) {
                setType(roomType as RoomType);
            } else {
                setType("normal");
            }
        }
    }, [isOpen, room, roomType]);

    // Separate useEffect for loading members to prevent unnecessary calls
    useEffect(() => {
        if (mode === "edit" && roomId && isOpen) {
            const loadMembers = async () => {
                try {
                    setLoadingMembers(true);
                    const result = await getRoomMembersOnly(roomId);
                    if (result && Array.isArray(result.data?.members)) {
                        const mappedMembers = result.data.members.map((m: RoomMember) => ({
                            _id: m.user._id,
                            username: m.user.username,
                            name: {
                                first: m.user.name?.first || "",
                                middle: m.user.name?.middle,
                                last: m.user.name?.last || "",
                            },
                            role: m.user.Role ? m.user.Role : (m.user as any).role || "",
                            metadata: {},
                        }));
                        setSelectedMembers(mappedMembers);
                    } else {
                        setSelectedMembers([]);
                    }
                } catch (error) {
                    console.error("Failed to load room members:", error);
                    setSelectedMembers([]);
                } finally {
                    setLoadingMembers(false);
                }
            };
            
            loadMembers();
        } else {
            setLoadingMembers(false);
        }
    }, [mode, roomId, isOpen, getRoomMembersOnly]); // Use faster function without restriction status

    const handleSubmit = async () => {
        if (!nameEn.trim() || !nameTh.trim() || !capacity.trim()) {
            return;
        }

        if (isNaN(Number(capacity)) || Number(capacity) < 0) {
            return;
        }

        if (roomType === "school" && !selectedSchool) {
            return;
        }

        if (roomType === "major" && !selectedMajor) {
            return;
        }
        if (selectedMembers.some(u => !u._id)) {
            addToast({
                title: "Invalid user",
                description: "Some selected users do not have a valid ID. Please re-select.",
                color: "danger",
            });
            return;
        }
        setLoading(true);

        try {
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
                    selectedMembers.forEach((user) => {
                        console.log("[RoomModal] Add member:", user);
                        if (user._id) {
                            formData.append("members", user._id);
                        } else {
                            addToast({
                                title: "Invalid user",
                                description: `User does not have a valid ID. Skipped.`,
                                color: "danger",
                            });
                        }
                    });
                }
            }

            if (image) {
                formData.append("image", image);
            }

            onSuccess(formData, mode);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB
                addToast({
                    title: "Image too large",
                    description: "Please select an image smaller than 2MB.",
                    color: "danger",
                });
                setShowImageSizeDialog(true);
                setImage(null);
                setImagePreview(null);
                setImageError(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const isFormValid = nameEn.trim() && nameTh.trim() && capacity.trim() &&
        ((roomType !== "school" && roomType !== "major") ||
            (roomType === "school" && selectedSchool) ||
            (roomType === "major" && selectedMajor)) &&
        !loadingMembers; // Prevent save while loading members

    return (
        <Modal isDismissable={false} isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
            <div>
                <ModalContent>
                    <ModalHeader>
                        {`${mode === "add" ? "Add" : "Edit"} ${roomType === "school" ? "School" : roomType === "major" ? "Major" : "Room"}`}
                    </ModalHeader>
                    <ModalBody>
                        {/* Room avatar, name, and type tag preview */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                                (type as string) === 'normal' ? 'bg-blue-500' :
                                (type as string) === 'readonly' ? 'bg-blue-700' :
                                (type as string) === 'mc' ? 'bg-purple-500' :
                                (type as string) === 'school' ? 'bg-green-600' :
                                (type as string) === 'major' ? 'bg-yellow-500' :
                                'bg-gray-400'
                            }`}>
                                {nameEn.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-lg truncate">{nameEn || 'Room Name'}</span>
                            {/* Show groupType tag for major/school */}
                            {(roomType === 'major' || roomType === 'school') && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                                    roomType === 'school' ? 'bg-green-100 text-green-700' :
                                    roomType === 'major' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {roomType === 'school' ? 'School' : 'Major'}
                                </span>
                            )}
                            {/* Show type tag always */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                                (type as string) === 'mc' ? 'bg-purple-100 text-purple-700' :
                                (type as string) === 'school' ? 'bg-green-100 text-green-700' :
                                (type as string) === 'major' ? 'bg-yellow-100 text-yellow-700' :
                                (type as string) === 'readonly' ? 'bg-blue-200 text-blue-800' :
                                (type as string) === 'normal' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {(type as string) === 'mc' ? 'Master of Ceremonies' : ((type ? type : '') as string).charAt(0).toUpperCase() + ((type ? type : '') as string).slice(1)}
                            </span>
                        </div>
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
                            <Input
                                isRequired
                                label="Capacity"
                                placeholder="0 = unlimited"
                                type="number"
                                min={0}
                                value={capacity}
                                onValueChange={setCapacity}
                            />
                            <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                                <InfinityIcon className="w-5 h-5" />
                                <span>Set to 0 for unlimited capacity</span>
                            </div>

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
                                isLoadingMembers={loadingMembers}
                                onShowAllMembers={(members) => {
                                    addToast({
                                        title: "All Members",
                                        description: `Showing all ${members.length} selected members`,
                                        color: "primary",
                                    });
                                }}
                            />

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-700">Room Image (Optional)</label>

                                <div className="flex items-start gap-6">
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

                                    <div className="flex-1 space-y-3">
                                        <Input
                                            accept="image/*"
                                            label="Choose new image"
                                            type="file"
                                            onChange={handleImageChange}
                                            ref={fileInputRef}
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
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            color="primary"
                            isDisabled={!isFormValid || loading || loadingMembers}
                            isLoading={loading || loadingMembers}
                            onPress={handleSubmit}
                        >
                            {mode === "add" ? "Add" : "Save"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </div>
            <Dialog isOpen={showImageSizeDialog} onClose={() => setShowImageSizeDialog(false)} size="sm">
                <ModalContent>
                    <ModalHeader>Image Too Large</ModalHeader>
                    <ModalBody>
                        <p>The selected image exceeds the 2MB size limit. Please choose a smaller image.</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={() => setShowImageSizeDialog(false)}>OK</Button>
                    </ModalFooter>
                </ModalContent>
            </Dialog>
        </Modal>
    );
}

"use client";

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import { InfinityIcon } from "lucide-react";
import { ImagePreview } from "./ImagePreview";
import { RoomMembersSelector } from "./RoomMembersSelector";
import { Room, RoomType } from "@/types/chat";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";
import { User } from "@/types/user";

type RoomModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (formData: FormData, mode: "add" | "edit") => void;
    room?: Room;
    mode: "add" | "edit";
    roomType: RoomType | "school" | "major";
};

function isUserArray(arr: any[]): arr is User[] {
    return arr.length > 0 && typeof arr[0] === "object" && "_id" in arr[0] && "username" in arr[0];
}

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
    const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [nameEnError, setNameEnError] = useState("");
    const [nameThError, setNameThError] = useState("");
    const [capacityError, setCapacityError] = useState("");
    const [schoolError, setSchoolError] = useState("");
    const [majorError, setMajorError] = useState("");
    const [shake, setShake] = useState(false);
    const nameEnRef = useRef<HTMLInputElement>(null);

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
            // Only set selectedMembers if members is array of user objects
            if (Array.isArray(members) && isUserArray(members)) {
                setSelectedMembers(members);
            } else {
                setSelectedMembers([]);
            }
        } else {
            resetFields();
        }
    }, [isOpen, room, roomType]);

    // Autofocus first field
    useEffect(() => {
        if (isOpen && nameEnRef.current) {
            nameEnRef.current.focus();
        }
    }, [isOpen]);

    // Reset error on change
    useEffect(() => { if (nameEn) setNameEnError(""); }, [nameEn]);
    useEffect(() => { if (nameTh) setNameThError(""); }, [nameTh]);
    useEffect(() => { if (capacity) setCapacityError(""); }, [capacity]);
    useEffect(() => { if (selectedSchool) setSchoolError(""); }, [selectedSchool]);
    useEffect(() => { if (selectedMajor) setMajorError(""); }, [selectedMajor]);

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
        setNameEnError("");
        setNameThError("");
        setCapacityError("");
        setSchoolError("");
        setMajorError("");
        setShake(false);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let hasError = false;
        if (!nameEn.trim()) {
            setNameEnError("กรุณากรอกชื่อห้อง (อังกฤษ)");
            hasError = true;
        }
        if (!nameTh.trim()) {
            setNameThError("กรุณากรอกชื่อห้อง (ไทย)");
            hasError = true;
        }
        if (!capacity.trim()) {
            setCapacityError("กรุณากรอกความจุ");
            hasError = true;
        }
        if (roomType === "school" && !selectedSchool) {
            setSchoolError("กรุณาเลือกโรงเรียน");
            hasError = true;
        }
        if (roomType === "major" && !selectedMajor) {
            setMajorError("กรุณาเลือกสาขา");
            hasError = true;
        }
        if (hasError) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            // focus first error
            if (!nameEn.trim() && nameEnRef.current) nameEnRef.current.focus();
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
            if (selectedMembers.some(u => u._id === "__SELECT_ALL__")) formData.append("selectAllUsers", "true");
            else selectedMembers.forEach((user, idx) => formData.append(`members[${idx}]`, user._id));
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

    // Check if form is valid
    const isFormValid = nameEn.trim() && nameTh.trim() && capacity.trim() &&
        ((roomType !== "school" && roomType !== "major") ||
         (roomType === "school" && selectedSchool) ||
         (roomType === "major" && selectedMajor));

    return (
        <Modal isOpen={isOpen} size="2xl" onClose={() => { onClose(); resetFields(); }}>
            <Form className="w-full" onSubmit={handleSubmit}>
                <ModalContent>
                    <ModalHeader>{`${mode === "add" ? "Add" : "Edit"} ${roomType === "school" ? "School" : roomType === "major" ? "Major" : "Room"}`}</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <Input
                                    ref={nameEnRef}
                                    label={<span>Room Name (English)<span className="text-red-500">*</span></span>}
                                    value={nameEn}
                                    onValueChange={setNameEn}
                                    isInvalid={!!nameEnError}
                                    className={shake && nameEnError ? "animate-shake border-red-500" : nameEnError ? "border-red-500" : ""}
                                    aria-invalid={!!nameEnError}
                                    aria-describedby="nameEnError"
                                    placeholder="Enter room name in English"
                                />
                                {nameEnError && <span id="nameEnError" className="text-xs text-red-500 ml-1">{nameEnError}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Input
                                    label={<span>Room Name (Thai)<span className="text-red-500">*</span></span>}
                                    value={nameTh}
                                    onValueChange={setNameTh}
                                    isInvalid={!!nameThError}
                                    className={shake && nameThError ? "animate-shake border-red-500" : nameThError ? "border-red-500" : ""}
                                    aria-invalid={!!nameThError}
                                    aria-describedby="nameThError"
                                    placeholder="กรอกชื่อห้องเป็นภาษาไทย"
                                />
                                {nameThError && <span id="nameThError" className="text-xs text-red-500 ml-1">{nameThError}</span>}
                            </div>
                        </div>

                        <Select label="Status*" selectedKeys={new Set([status])} onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as "active" | "inactive")}>
                            <SelectItem key="active" className="text-green-600">Active</SelectItem>
                            <SelectItem key="inactive" className="text-red-600">Inactive</SelectItem>
                        </Select>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <Input
                                    label={<span>Capacity<span className="text-red-500">*</span></span>}
                                    min={0}
                                    type="number"
                                    value={capacity}
                                    onValueChange={setCapacity}
                                    isInvalid={!!capacityError}
                                    className={shake && capacityError ? "animate-shake border-red-500" : capacityError ? "border-red-500" : ""}
                                    aria-invalid={!!capacityError}
                                    aria-describedby="capacityError"
                                    placeholder="0 = unlimited"
                                />
                                {capacityError && <span id="capacityError" className="text-xs text-red-500 ml-1">{capacityError}</span>}
                            </div>
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
                            <div className="flex flex-col gap-1">
                                <Select isLoading={schoolsLoading} label={<span>Select School<span className="text-red-500">*</span></span>} selectedKeys={selectedSchool ? [selectedSchool] : []} onSelectionChange={(keys) => setSelectedSchool(Array.from(keys)[0] as string)}>
                                    {schools.map(school => <SelectItem key={school._id}>{school.name.en}</SelectItem>)}
                                </Select>
                                {schoolError && <span className="text-xs text-red-500 ml-1">{schoolError}</span>}
                            </div>
                        )}

                        {roomType === "major" && (
                            <div className="flex flex-col gap-1">
                                <Select isLoading={majorsLoading} label={<span>Select Major<span className="text-red-500">*</span></span>} selectedKeys={selectedMajor ? [selectedMajor] : []} onSelectionChange={(keys) => setSelectedMajor(Array.from(keys)[0] as string)}>
                                    {majors.map(major => <SelectItem key={major._id}>{major.name.en}</SelectItem>)}
                                </Select>
                                {majorError && <span className="text-xs text-red-500 ml-1">{majorError}</span>}
                            </div>
                        )}

                        <RoomMembersSelector 
                            selectedMembers={selectedMembers} 
                            setSelectedMembers={setSelectedMembers} 
                            allowSelectAll={roomType !== 'school' && roomType !== 'major'}
                        />
                        <Input accept="image/*" label="Room Image (Optional)" type="file" onChange={handleImageChange} />
                        <ImagePreview imagePreview={imagePreview} onRemove={() => { setImage(null); setImagePreview(null); }} />
                    </ModalBody>

                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => { onClose(); resetFields(); }}>Cancel</Button>
                        <Button color="primary" type="submit" isDisabled={!isFormValid}>{mode === "add" ? "Add" : "Save"}</Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    );
}

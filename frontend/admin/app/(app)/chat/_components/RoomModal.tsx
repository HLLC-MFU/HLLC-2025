"use client";

import { Room, RoomType } from "@/types/chat";
import { School } from "@/types/school";
import { Major } from "@/types/major";
import { Button, Badge, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";
import { getToken } from "@/utils/storage";
import { Image as ImageIcon, Infinity, Users, UserPlus } from "lucide-react";
import { ImagePreview } from "./ImagePreview";

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (formData: FormData, mode: "add" | "edit") => void;
    room?: Room;
    mode: "add" | "edit";
    roomType: RoomType | "school" | "major";
}

export function RoomModal({ 
    isOpen,
    onClose, 
    onSuccess, 
    room, 
    mode,
    roomType
}: RoomModalProps) {
    const { schools, loading: schoolsLoading } = useSchools();
    const { majors, loading: majorsLoading } = useMajors();
    const { users, loading: usersLoading, fetchByUsername } = useUsers();
    
    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [type, setType] = useState<RoomType>(RoomType.NORMAL);
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [capacity, setCapacity] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedMajor, setSelectedMajor] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (room) {
            setNameEn(room.name.en);
            setNameTh(room.name.th);
            setType(room.type);
            setStatus(room.status || "active");
            setCapacity(room.capacity.toString());
            // Set group values if they exist
            if (room.metadata?.groupType === "school" && room.metadata?.groupValue) {
                setSelectedSchool(room.metadata.groupValue);
            }
            if (room.metadata?.groupType === "major" && room.metadata?.groupValue) {
                setSelectedMajor(room.metadata.groupValue);
            }
            // Set members if they exist
            if (room.members && Array.isArray(room.members)) {
                setSelectedMembers(room.members);
            }
        } else {
            resetFields();
        }
    }, [room, roomType]);



    // Debounced search function
    const debouncedSearch = useCallback((query: string) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        const timeout = setTimeout(() => {
            if (query.trim()) {
                fetchByUsername(query.trim());
            }
        }, 500); // 500ms delay
        
        setSearchTimeout(timeout);
    }, [fetchByUsername, searchTimeout]);

    // Handle search input change
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const resetFields = () => {
        setNameEn("");
        setNameTh("");
        setType(roomType === "school" || roomType === "major" ? RoomType.NORMAL : roomType as RoomType);
        setStatus("active");
        setCapacity("");
        setSelectedSchool("");
        setSelectedMajor("");
        setSelectedMembers([]);
        setSearchQuery("");
        setImage(null);
        setImagePreview(null);
    };

    const getModalTitle = () => {
        switch (roomType) {
            case RoomType.NORMAL:
                return mode === "add" ? "Add Normal Room" : "Edit Normal Room";
            case RoomType.READONLY:
                return mode === "add" ? "Add Readonly Room" : "Edit Readonly Room";
            case "school":
                return mode === "add" ? "Add School Room" : "Edit School Room";
            case "major":
                return mode === "add" ? "Add Major Room" : "Edit Major Room";
            default:
                return mode === "add" ? "Add Room" : "Edit Room";
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nameEn.trim() || !nameTh.trim() || !capacity.trim()) {
            return;
        }

        // Validate group selections
        if (roomType === "school" && !selectedSchool) {
            alert("Please select a school");
            return;
        }
        if (roomType === "major" && !selectedMajor) {
            alert("Please select a major");
            return;
        }

        const formData = new FormData();
        formData.append("name[en]", nameEn.trim());
        formData.append("name[th]", nameTh.trim());
        formData.append("type", type);
        formData.append("status", status);
        formData.append("capacity", capacity);
        
        // Get user ID from token (you might need to adjust this based on your auth structure)
        const token = getToken('accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub) {
                    formData.append("createdBy", payload.sub);
                }
            } catch (e) {
                console.warn("Could not extract user ID from token");
            }
        }
        
        // Add group-specific fields
        if (roomType === "school") {
            formData.append("groupType", "school");
            formData.append("groupValue", selectedSchool);
        } else if (roomType === "major") {
            formData.append("groupType", "major");
            formData.append("groupValue", selectedMajor);
        }

        // Add members if selected
        if (selectedMembers.length > 0) {
            if (selectedMembers.includes('__SELECT_ALL__')) {
                // Special flag for select all users
                formData.append("selectAllUsers", "true");
            } else {
                // Add individual selected members
                selectedMembers.forEach((memberId, index) => {
                    formData.append(`members[${index}]`, memberId);
                });
            }
        }

        // Add image if selected
        if (image) {
            formData.append("image", image);
        }

        onSuccess(formData, mode);
        resetFields();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                        {getModalTitle()}
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
                                label="Status"
                                placeholder="Select room status"
                                selectedKeys={[status]}
                                onSelectionChange={(keys) => {
                                    const selectedStatus = Array.from(keys)[0] as "active" | "inactive";
                                    setStatus(selectedStatus);
                                }}
                            >
                                <SelectItem key="active">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-success rounded-full"></div>
                                        <span>Active</span>
                                    </div>
                                </SelectItem>
                                <SelectItem key="inactive">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-danger rounded-full"></div>
                                        <span>Inactive</span>
                                    </div>
                                </SelectItem>
                            </Select>
                            
                            <div className="flex flex-col gap-2">
                                <Input
                                    isRequired
                                    label="Capacity"
                                    placeholder="Enter room capacity (0 = unlimited)"
                                    type="number"
                                    min="0"
                                    value={capacity}
                                    onValueChange={setCapacity}
                                    endContent={
                                        capacity === "0" && (
                                            <div className="flex items-center gap-1 text-success text-xs font-medium">
                                                <Infinity size={12} />
                                                <span>Unlimited</span>
                                            </div>
                                        )
                                    }
                                />
                                <div className="flex items-center gap-2 text-xs text-default-500">
                                    <Infinity size={12} />
                                    <span>Set to 0 for unlimited capacity</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Room Type - Only show for school/major rooms */}
                            {(roomType === "school" || roomType === "major") && (
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
                            )}
                            
                            {/* School Selection */}
                            {roomType === "school" && (
                                <Select
                                    isRequired
                                    label="Select School"
                                    placeholder={schoolsLoading ? "Loading schools..." : "Choose a school"}
                                    selectedKeys={selectedSchool ? [selectedSchool] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setSelectedSchool(selectedKey);
                                    }}
                                    isLoading={schoolsLoading}
                                >
                                    {schools.map((school) => (
                                        <SelectItem key={school._id} textValue={school.name.en}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{school.name.en}</span>
                                                <span className="text-small text-default-500">{school.name.th}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                            
                            {/* Major Selection */}
                            {roomType === "major" && (
                                <Select
                                    isRequired
                                    label="Select Major"
                                    placeholder={majorsLoading ? "Loading majors..." : "Choose a major"}
                                    selectedKeys={selectedMajor ? [selectedMajor] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setSelectedMajor(selectedKey);
                                    }}
                                    isLoading={majorsLoading}
                                >
                                    {majors.map((major) => (
                                        <SelectItem key={major._id} textValue={major.name.en}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{major.name.en}</span>
                                                <span className="text-small text-default-500">{major.name.th}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </div>

                        {/* Members Selection */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Members (Optional)</span>
                                    <div className="flex items-center gap-2">
                                        <Badge size="sm" variant="flat" color="primary">
                                            {selectedMembers.length} selected
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="secondary"
                                            startContent={<Users size={14} />}
                                            onPress={() => {
                                                // Show confirmation dialog for select all
                                                if (confirm("This will select all users in the system. Are you sure?")) {
                                                    // For now, we'll use a special flag to indicate "select all"
                                                    // In the backend, you can handle this by fetching all users
                                                    setSelectedMembers(['__SELECT_ALL__']);
                                                }
                                            }}
                                            isDisabled={selectedMembers.includes('__SELECT_ALL__')}
                                        >
                                            Select All Users
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <Input
                                        label="Search Users"
                                        placeholder="Type username to search..."
                                        value={searchQuery}
                                        onValueChange={handleSearchChange}
                                        startContent={<UserPlus size={16} />}
                                    />
                                    
                                    <Select
                                        label="Add Members"
                                        placeholder={usersLoading ? "Loading users..." : "Select users from search results"}
                                        selectedKeys={selectedMembers.filter(id => id !== '__SELECT_ALL__')}
                                        onSelectionChange={(keys) => {
                                            const newMembers = Array.from(keys) as string[];
                                            setSelectedMembers(newMembers);
                                        }}
                                        isLoading={usersLoading}
                                        selectionMode="multiple"
                                        classNames={{
                                            base: "max-h-40",
                                        }}
                                    >
                                        {users.map((user) => (
                                            <SelectItem key={user._id} textValue={user.username}>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{user.username}</span>
                                                    <span className="text-small text-default-500">
                                                        {user.name?.first} {user.name?.last}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                
                                {/* Show selected members summary */}
                                {selectedMembers.length > 0 && (
                                    <div className="text-xs text-default-500">
                                        {selectedMembers.includes('__SELECT_ALL__') 
                                            ? "All users will be added to this room"
                                            : `${selectedMembers.length} user(s) selected`
                                        }
                                    </div>
                                )}
                                
                                {/* Show no results message */}
                                {users.length === 0 && searchQuery && !usersLoading && (
                                    <div className="text-xs text-default-500">
                                        No users found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                type="file"
                                label="Room Image (Optional)"
                                accept="image/*"
                                onChange={handleImageChange}
                                startContent={<ImageIcon size={16} />}
                            />
                            
                            {/* Image Preview */}
                            <ImagePreview
                                imagePreview={imagePreview}
                                onRemove={() => {
                                    setImage(null);
                                    setImagePreview(null);
                                }}
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


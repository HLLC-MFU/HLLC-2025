"use client";

import { useState, useCallback } from "react";
import { Badge, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Users, UserPlus, X } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";

type RoomMembersSelectorProps = {
    selectedMembers: string[];
    setSelectedMembers: React.Dispatch<React.SetStateAction<string[]>>;
};

export function RoomMembersSelector({ selectedMembers, setSelectedMembers }: RoomMembersSelectorProps) {
    const { users, fetchByUsername } = useUsers();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showSelectAllModal, setShowSelectAllModal] = useState(false);

    // Debounced search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (searchTimeout) clearTimeout(searchTimeout);
        if (query.trim()) {
            const timeout = setTimeout(() => fetchByUsername(query), 300);
            setSearchTimeout(timeout);
        }
    }, [fetchByUsername, searchTimeout]);

    // Toggle member selection
    const handleUserSelect = (userId: string) => {
        setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    // Select all users
    const handleSelectAll = () => setShowSelectAllModal(true);
    const confirmSelectAll = () => {
        setSelectedMembers(["__SELECT_ALL__"]);
        setShowSelectAllModal(false);
    };

    const handleClearAll = () => setSelectedMembers([]);
    const getSelectedUserNames = () => selectedMembers.includes("__SELECT_ALL__") 
        ? ["All Users"] 
        : selectedMembers.map(id => users.find(u => u._id === id)?.username || id);

    const isSelectAllActive = selectedMembers.includes("__SELECT_ALL__");

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Members (Optional)</span>
                <div className="flex items-center gap-2">
                    {selectedMembers.length > 0 && (
                        <Button size="sm" variant="light" color="danger" onPress={handleClearAll}>Clear All</Button>
                    )}
                    <Button size="md" variant={isSelectAllActive ? "solid" : "flat"} color="danger" startContent={<Users size={18} />} 
                        onPress={handleSelectAll} isDisabled={isSelectAllActive} className="font-bold shadow-md">
                        Select All Users
                    </Button>
                </div>
            </div>

            {/* Search Input */}
            <Input label="Search Users" placeholder="Type to search users..." value={searchQuery} 
                onValueChange={handleSearch} startContent={<Users size={20} />} isDisabled={isSelectAllActive} />

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
                <div className="space-y-2">
                    <span className="text-sm text-default-500">Selected Members:</span>
                    <div className="flex flex-wrap gap-2">
                        {getSelectedUserNames().map((username, index) => (
                            <div key={selectedMembers[index] || index} className="flex items-center gap-1">
                                <Badge color="secondary" variant="flat">{username}</Badge>
                                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleUserSelect(selectedMembers[index])}>
                                    <X size={12} />
                                </Button>
                            </div>
                        ))}
                    </div>
                    {isSelectAllActive && (
                        <div className="flex items-center gap-2 mt-2">
                            <Badge color="danger" variant="solid" className="text-base font-bold">ALL USERS SELECTED</Badge>
                            <span className="text-danger-600 font-semibold">All users in the system will be added to this room</span>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results */}
            {searchQuery && !isSelectAllActive && (
                <div className="space-y-2">
                    <span className="text-sm text-default-500">Search Results:</span>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {users.map(user => (
                            <div key={user._id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(user._id) ? "bg-secondary-100 border border-secondary-200" : "bg-default-50 hover:bg-default-100"}`} onClick={() => handleUserSelect(user._id)}>
                                <div className="flex items-center gap-2">
                                    <UserPlus size={16} className="text-default-400" />
                                    <span className="text-sm">{user.username}</span>
                                </div>
                                {selectedMembers.includes(user._id) && <Badge size="sm" color="secondary" variant="flat">Selected</Badge>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {searchQuery && !users.length && !isSelectAllActive && (
                <div className="text-center py-4">
                    <span className="text-sm text-default-400">No users found</span>
                </div>
            )}

            {/* Select All Confirmation Modal */}
            <Modal isOpen={showSelectAllModal} onClose={() => setShowSelectAllModal(false)} size="sm">
                <ModalContent>
                    <ModalHeader>Select All Users</ModalHeader>
                    <ModalBody>
                        <p>This will add all users in the system to this room. Are you sure?</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setShowSelectAllModal(false)}>Cancel</Button>
                        <Button color="secondary" onPress={confirmSelectAll}>Confirm</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}

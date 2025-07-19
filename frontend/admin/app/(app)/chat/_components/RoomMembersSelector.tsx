"use client";

import { useState, useCallback } from "react";
import { Badge, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Users, UserPlus, X } from "lucide-react";

import { useUsers } from "@/hooks/useUsers";
import { User } from "@/types/user";

type RoomMembersSelectorProps = {
    selectedMembers: User[];
    setSelectedMembers: React.Dispatch<React.SetStateAction<User[]>>;
    allowSelectAll?: boolean;
};

export function RoomMembersSelector({ selectedMembers, setSelectedMembers, allowSelectAll = true }: RoomMembersSelectorProps) {
    const { users, fetchByUsername } = useUsers();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showSelectAllModal, setShowSelectAllModal] = useState(false);

    // Debounced search
    const handleSearch = useCallback((query: string) => {
        console.log('Searching for users with query:', query);
        setSearchQuery(query);
        if (searchTimeout) clearTimeout(searchTimeout);
        if (query.trim()) {
            const timeout = setTimeout(() => {
                console.log('Fetching users with query:', query);
                fetchByUsername(query);
            }, 300);
            setSearchTimeout(timeout);
        }
    }, [fetchByUsername, searchTimeout]);

    // Toggle member selection
    const handleUserSelect = (user: User) => {
        console.log('Selecting/deselecting user:', user.username || user.name?.first, 'ID:', user._id);
        setSelectedMembers(prev => {
            if (prev.some(u => u._id === user._id)) {
                console.log('Removing user from selected members');
                return prev.filter(u => u._id !== user._id);
            } else {
                console.log('Adding user to selected members');
                return [...prev.filter(u => u._id !== "__SELECT_ALL__"), user];
            }
        });
    };

    // Select all users
    const handleSelectAll = () => setShowSelectAllModal(true);
    const confirmSelectAll = () => {
        setSelectedMembers([{ _id: "__SELECT_ALL__", username: "All Users", name: { first: "All", last: "Users" }, role: "", metadata: {} } as User]);
        setShowSelectAllModal(false);
    };

    const handleClearAll = () => setSelectedMembers([]);
    const isSelectAllActive = selectedMembers.some(u => u._id === "__SELECT_ALL__");

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Add Members (Optional)</span>
                    <span className="text-xs text-default-500">Select additional members to add to this room</span>
                </div>
                <div className="flex items-center gap-2">
                    {selectedMembers.length > 0 && (
                        <Button color="default" size="sm" variant="light" onPress={handleClearAll}>Clear All</Button>
                    )}
                    {allowSelectAll && (
                        <Button className="font-bold shadow-md" color="primary" isDisabled={isSelectAllActive} size="md"
                            startContent={<Users size={18} />} variant={isSelectAllActive ? "solid" : "flat"} onPress={handleSelectAll}>
                            Select All Users
                        </Button>
                    )}
                </div>
            </div>

            {/* Search Input */}
            <Input isDisabled={isSelectAllActive} label="Search Users" placeholder="Type to search users..."
                startContent={<Users size={20} />} value={searchQuery} onValueChange={handleSearch} />

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
                <div className="space-y-2">
                    <span className="text-sm text-default-500">Selected Members:</span>
                    <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((user, index) => (
                            <div key={user._id || index} className="flex items-center gap-1 bg-default-50 rounded-full px-2 py-1">
                                <span className="font-medium text-sm">{user.username || `${user.name?.first || ''} ${user.name?.last || ''}`.trim()}</span>
                                {user._id !== "__SELECT_ALL__" && (
                                    <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => handleUserSelect(user)}>
                                        <X size={12} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    {isSelectAllActive && (
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-base font-bold" color="primary" variant="solid">ALL USERS SELECTED</Badge>
                            <span className="text-primary-600 font-semibold">All users in the system will be added to this room</span>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results */}
            {searchQuery && !isSelectAllActive && (
                <div className="space-y-2">
                    <span className="text-sm text-default-500">Search Results:</span>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {(() => {
                            const availableUsers = users.filter(user => !selectedMembers.some(u => u._id === user._id));
                            console.log('Available users for selection:', availableUsers.length, 'users:', availableUsers);
                            return availableUsers.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors bg-default-50 hover:bg-default-100"
                                onClick={() => handleUserSelect(user)}>
                                <div className="flex items-center gap-2">
                                    <UserPlus className="text-default-400" size={16} />
                                    <span className="text-sm font-medium">{user.username || `${user.name?.first || ''} ${user.name?.last || ''}`.trim()}</span>
                                    {user.name?.first && <span className="text-xs text-default-400">{user.name?.first} {user.name?.last}</span>}
                                </div>
                            </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {searchQuery && !users.length && !isSelectAllActive && (
                <div className="text-center py-4">
                    <span className="text-sm text-default-400">No users found</span>
                </div>
            )}

            {/* Select All Confirmation Modal */}
            {allowSelectAll && (
                <Modal isOpen={showSelectAllModal} size="sm" onClose={() => setShowSelectAllModal(false)}>
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
            )}
        </div>
    );
}

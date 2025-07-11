import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider } from "@heroui/react";
import { useState } from "react";

import { ActivityType } from "@/types/activities";

interface ActivityTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (activityType: Partial<ActivityType>) => void;
    mode: 'add' | 'edit';
    activityType?: ActivityType;
    loading?: boolean;
}

export function ActivityTypeModal({ isOpen, onClose, onSubmit, mode, activityType, loading }: ActivityTypeModalProps) {
    const [name, setName] = useState(activityType?.name || '');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;

        const trimmedName = name.trim();

        if (!trimmedName) return;

        onSubmit({ name: trimmedName });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            size="md"
            onClose={onClose}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === 'add' ? 'Add New Activity Type' : 'Edit Activity Type'}
                    </ModalHeader>
                    <Divider />
                    <ModalBody className="gap-4">
                        <Input
                            autoFocus
                            isRequired
                            isDisabled={loading}
                            label="Type Name"
                            placeholder="Enter activity type name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button 
                            isDisabled={loading} 
                            variant="light"
                            onPress={onClose}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary"
                            isDisabled={loading || !name.trim()}
                            isLoading={loading}
                            type="submit"
                        >
                            {mode === 'add' ? 'Create Type' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 
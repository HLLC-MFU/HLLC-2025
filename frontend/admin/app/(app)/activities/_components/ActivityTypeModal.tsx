import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider } from "@heroui/react";
import { ActivityType } from "@/types/activities";
import { useState } from "react";

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
            onClose={onClose}
            size="md"
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
                            label="Type Name"
                            placeholder="Enter activity type name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            isRequired
                            isDisabled={loading}
                        />
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button 
                            variant="light" 
                            onPress={onClose}
                            isDisabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary"
                            type="submit"
                            isDisabled={loading || !name.trim()}
                            isLoading={loading}
                        >
                            {mode === 'add' ? 'Create Type' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider, Form } from "@heroui/react";
import { useEffect, useState } from "react";

import { ActivityType } from "@/types/activities";

type ActivitiesTypeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (activityType: Partial<ActivityType>) => void;
    mode: 'add' | 'edit';
    activityType?: ActivityType;
    loading?: boolean;
}

export function ActivitiesTypeModal({ isOpen, onClose, onSubmit, mode, activityType, loading }: ActivitiesTypeModalProps) {
    const [name, setName] = useState(activityType?.name || '');

    useEffect(() => {
        if (mode === 'edit' && activityType) {
            setName(activityType.name || '');
        } else if (mode === 'add') {
            setName('');
        }
    }, [mode, activityType, isOpen]);

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
                <Form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === 'add' ? 'Add New Activity Type' : 'Edit Activity Type'}
                    </ModalHeader>
                    <Divider />
                    <ModalBody className="gap-4 w-full">
                        <Input
                            autoFocus
                            isRequired
                            isDisabled={loading}
                            label="Type Name"
                            placeholder="Enter activity type name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            variant="bordered"
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
                </Form>
            </ModalContent>
        </Modal>
    );
} 
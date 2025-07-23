'use client';

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Image,
} from '@heroui/react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    photoUrl: string | null;
}

export default function TutorialModal({ isOpen, onClose, photoUrl }: TutorialModalProps) {
    return (
        <Modal isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent className="max-w-2xl">
                {() => (
                    <>
                        <ModalHeader className="text-center text-xl font-semibold text-black/80">
                            Lamduan Tutorial
                        </ModalHeader>

                        <ModalBody className="p-0 min-h-[300px] flex items-center">
                            {photoUrl ? (
                                <Image
                                    src={photoUrl}
                                    alt="Tutorial"
                                    className="w-full h-full object-contain rounded-xl"
                                    style={{ minHeight: '300px' }}
                                />
                            ) : (
                                <p className="text-gray-500 text-center p-4">No tutorial photo available.</p>
                            )}
                        </ModalBody>


                        <ModalFooter>
                            <Button color="danger" onPress={onClose} className="w-full rounded-full">
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

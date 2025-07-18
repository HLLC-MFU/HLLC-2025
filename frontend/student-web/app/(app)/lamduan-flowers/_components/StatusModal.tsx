'use client';

import { Button, Modal, ModalContent } from '@heroui/react';
import React from 'react';

interface StatusModalProps {
    isVisible: boolean;
    onClose: () => void;
    status: 'not-started' | 'ended' | 'active';
}

export function StatusModal({ isVisible, onClose, status }: StatusModalProps) {
    if (!isVisible || status === 'active') return null;

    const getMessage = () => {
        switch (status) {
            case 'not-started':
                return 'The activity has not started yet.';
            case 'ended':
                return 'The activity has ended.';
            default:
                return '';
        }
    };

    return (
        <Modal isOpen={isVisible} placement="center" backdrop="blur" hideCloseButton className="flex bg-white/40 border items-center justify-center gap-6 m-10 p-6">
            <ModalContent>
                <h2 className="text-xl font-semibold text-[#FF9F00]">Warning</h2>
                <p className="text-sm text-black/80">{getMessage()}</p>

                <div className="pt-2">
                    <Button
                        onPress={onClose}
                        className="w-full py-2 rounded-full bg-[#FFB22C] hover:brightness-110 text-white font-bold transition"
                    >
                        OK
                    </Button>
                </div>
            </ModalContent>
        </Modal>
    );
}

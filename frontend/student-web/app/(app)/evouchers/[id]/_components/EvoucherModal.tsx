import { EvoucherCodes } from "@/types/evouchers";
import { Modal, ModalContent, ModalBody, Image, Button, } from "@heroui/react";
import { useState, useEffect } from "react";

type EvoucherModal = {
    isOpen: boolean;
    onClose: () => void;
    code: EvoucherCodes | null;
    setIsConfirmOpen: () => void;
};

export default function EvoucherModal({
    isOpen,
    onClose,
    code,
    setIsConfirmOpen,
}: EvoucherModal) {
    const [isFlipped, setIsFlipped] = useState(true);
    const [isFront, setIsFront] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsFront(isFlipped);
        }, 300);

        return () => clearTimeout(timeout);
    }, [isFlipped])

    return (
        <>
            {code && (
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    placement="center"
                    className="bg-transparent border-none shadow-none"
                    classNames={{
                        backdrop: "bg-black/80 ",
                    }}
                    hideCloseButton
                >
                    <ModalContent>
                        <ModalBody>
                            <Image
                                alt='Preload'
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code.evoucher.photo.back}`}
                                className="hidden"
                            />

                            {code.evoucher?.photo?.front && (
                                <div className={`w-full h-full transition-all duration-700 ${isFlipped ? '' : 'scale-x-[-1]'}`}>
                                    {isFront ? (
                                        < Image
                                            alt={code.code}
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code.evoucher.photo.front}`}
                                            onClick={() => setIsFlipped(prev => !prev)}
                                        />
                                    ) : (
                                        <>
                                            <div className="scale-x-[-1]">
                                                <Image
                                                    alt={code.code}
                                                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code.evoucher.photo.back}`}
                                                    onClick={() => setIsFlipped(prev => !prev)}
                                                    className="z-0"

                                                />
                                                {code.isUsed ? (
                                                    <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 bottom-[10%] gap-4">
                                                        <Image
                                                            alt="SDAD"
                                                            src='/pictures/logo-qr.png'
                                                            className="w-[40%] mx-auto"
                                                            onClick={() => setIsFlipped(prev => !prev)}
                                                        />
                                                        <p className="text-[#d8cfcd] font-bold" onClick={() => setIsFlipped(prev => !prev)}>Used</p>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        className="absolute rounded-full left-1/2 -translate-x-1/2 bottom-[10%]"
                                                        onPress={setIsConfirmOpen}
                                                    >
                                                        Use
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </ div>
                            )}
                            <p className="text-white text-center">Click Voucher to Flip</p>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </>
    )
}
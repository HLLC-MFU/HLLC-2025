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
    }, [isFlipped]);

    const handleImageError = (code: EvoucherCodes, background: string) => {
        return (
            <div
                className={`flex justify-center items-center w-[250px] h-[550px] rounded-2xl shadow-xl ${background} backdrop-blur-md border border-white`}
                onClick={() => setIsFlipped(prev => !prev)}
            >
                <p className="font-semibold text-white">{code.code}</p>
            </div>
        )
    }

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
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code.evoucher?.photo?.back ?? ""}`}
                                className="hidden"
                            />

                            <div className={`flex w-full h-full justify-center transition-all duration-700 ${isFlipped ? '' : 'scale-x-[-1]'}`}>
                                {isFront ? (
                                    code?.evoucher?.photo?.front ? (
                                        < Image
                                            alt={code?.code}
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code?.evoucher?.photo?.front}`}
                                            onClick={() => setIsFlipped(prev => !prev)}
                                        />
                                    ) : (
                                        handleImageError(code, "bg-white/40")
                                    )

                                ) : (
                                    <>
                                        <div className="scale-x-[-1]">
                                            {code?.evoucher?.photo?.back ? (
                                                <Image
                                                    alt={code?.code}
                                                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${code?.evoucher?.photo?.back}`}
                                                    onClick={() => setIsFlipped(prev => !prev)}
                                                    className="z-0"

                                                />
                                            ) : (
                                                handleImageError(code, "bg-black/40")
                                            )}
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
                            <p className="text-white text-center">Click Voucher to Flip</p>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </>
    )
}
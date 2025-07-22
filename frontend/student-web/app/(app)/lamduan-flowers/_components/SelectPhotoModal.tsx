'use client';

import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Button,
    addToast,
} from '@heroui/react';
import { Camera, Image as Gallery, Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SelectPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: File, preview: string) => void;
}

export default function SelectPhotoModal({
    isOpen,
    onClose,
    onSelect,
}: SelectPhotoModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [isFrontCamera, setIsFrontCamera] = useState(false);

    const handlePickImage = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.click();

            input.onchange = () => {
                const file = input.files?.[0];
                if (file) {
                    const preview = URL.createObjectURL(file);
                    onSelect(file, preview);
                }
            };
        } catch (err) {
            console.error('Failed to pick image:', err);
        }
    };

    const enableCamera = async () => {
        try {
            const constraints = {
                video: { facingMode: isFrontCamera ? 'user' : 'environment' },
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setMediaStream(stream);
            setShowCamera(true);
        } catch (err) {
            console.error('Failed to access camera:', err);
            addToast({
                title: `Cannot access ${isFrontCamera ? 'front' : 'back'} camera`,
                color: 'warning',
            });
        }
    };

    const flipCamera = async () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
            setMediaStream(null);
        }
        setIsFrontCamera((prev) => !prev);
    };

    const captureFromCamera = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'photo.png', { type: 'image/png' });
                    const preview = URL.createObjectURL(blob);
                    onSelect(file, preview);
                    handleClose();
                }
            }, 'image/png');
        }
    };

    const handleClose = () => {
        setShowCamera(false);
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }
        setMediaStream(null);
        onClose();
    };

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    useEffect(() => {
        if (showCamera) {
            enableCamera();
        }
    }, [isFrontCamera]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={handleClose}
            backdrop="blur"
            className="z-[100] bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
        >
            <ModalContent>
                {(onCloseFn) => (
                    <>
                        <ModalHeader className="text-lg font-semibold text-center text-white">
                            Upload Picture
                        </ModalHeader>

                        <ModalBody className="space-y-4 text-white">
                            {showCamera ? (
                                <div className="space-y-4">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full rounded-xl border border-white/30"
                                    />

                                    <div className="flex gap-2">
                                        <Button
                                            onPress={flipCamera}
                                            className="w-1/2 bg-white/10 text-white border border-white/30 backdrop-blur rounded-full"
                                        >
                                            <Repeat size={18} /> Flip
                                        </Button>
                                        <Button
                                            onPress={captureFromCamera}
                                            className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                        >
                                            <Camera size={18} /> Capture
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        onPress={enableCamera}
                                        className="w-full h-[56px] text-base rounded-full bg-black/10 border border-white/30 text-white font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <Camera size={18} /> Take Photo
                                    </Button>

                                    <Button
                                        onPress={() => {
                                            handlePickImage();
                                            onCloseFn();
                                        }}
                                        className="w-full h-[56px] text-base rounded-full bg-black/10 border border-white/30 text-white font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <Gallery size={18} /> Choose from Gallery
                                    </Button>
                                </>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                color="danger"
                                className="w-full h-[56px] text-base rounded-full text-white font-bold flex items-center justify-center gap-2 transition"
                                onPress={handleClose}
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

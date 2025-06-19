import { Button, Input } from '@heroui/react';
import { Image, Save, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react';

type AssetsInputFieldProps = {
    title: string;
    image?: string;
    onSave: (interfaceData: FormData) => Promise<void>;
}

export default function AssetsInputField({
    title,
    image,
    onSave,
}: AssetsInputFieldProps) {
    const reader = new FileReader();
    const imageRef = useRef<HTMLInputElement | null>(null);
    const [previewImage, setPreviewImage] = useState<string>("");
    const [fileChange, setFileChange] = useState<File | null>(null);

    const handleChange = (file: File) => {
        reader.onload = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        const formData = new FormData;
        if (fileChange) formData.append(`assets[${title.toLowerCase()}]`, fileChange);

        onSave(formData);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <p className="text-md font-semibold">{title}</p>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Upload size={14} />}
                        onPress={() => imageRef.current?.click()}
                    >
                        Upload
                    </Button>
                    {previewImage && (
                        <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onPress={() => {
                                setPreviewImage("");
                                setFileChange(null);
                            }}
                        >
                            <X size={14} />
                        </Button>
                    )}
                </div>
            </div>
            <div className="flex justify-center items-center aspect-square rounded-xl border border-default-200 bg-default-50 transition-all duration-200 hover:border-primary/50 overflow-hidden">
                {(previewImage) ? (
                    <img
                        src={previewImage}
                    />
                ) : (image) ? (
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${image}`}
                    />
                ) : (
                    <Image size={80} className="text-gray-400" />
                )}
            </div>

            {previewImage && (
                <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    startContent={<Save size={14} />}
                    onPress={handleSave}
                >
                    Save
                </Button>
            )}

            <Input
                ref={imageRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        handleChange(file);
                        setFileChange(file);
                    }
                }}
                className="hidden"
            />
        </div>
    )
}
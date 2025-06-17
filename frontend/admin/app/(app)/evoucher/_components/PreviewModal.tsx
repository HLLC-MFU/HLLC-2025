import React, { useRef } from "react";
import { Button, Input } from "@heroui/react";
import { Image, Upload, X } from "lucide-react";

interface PreviewModalProps {
    field: {
        cover: File | string | null;
    };
    setField: (field: { cover: File | string | null }) => void;
    previewImage: string;
    setPreviewImage: (url: string) => void;
    handleFileChange: (file: File) => void;
    title: "Add" | "Edit";
}

const IMAGE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PreviewModal({
    field,
    setField,
    previewImage,
    setPreviewImage,
    handleFileChange,
    title
}: PreviewModalProps) {
    const coverInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2 max-w-[400px]">
            <h3 className="text-sm font-medium mb-3">Photos</h3>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-default-700">Cover Photo</h4>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Upload size={14} />}
                        onPress={() => coverInputRef.current?.click()}
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
                                setField({ ...field, cover: null });
                                setPreviewImage("");
                            }}
                        >
                            <X size={14} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative aspect-square rounded-xl border border-default-200 bg-default-50 transition-all duration-200 hover:border-primary/50">
                {previewImage ? (
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-contain max-w-[400px] bg-white rounded-xl"
                    />
                ) : typeof field.cover === "string" ? (
                    <img
                        src={`${IMAGE_URL}/uploads/${field.cover}`}
                        alt="Preview"
                        className="w-full h-full object-contain max-w-[400px] bg-white rounded-xl"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                        <Image size={24} />
                        <span className="text-xs">No image uploaded</span>
                    </div>
                )}
            </div>

            <Input
                required={!(title === "Edit" && typeof field.cover === "string")}
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setField({ ...field, cover: file });
                        handleFileChange(file);
                    }
                }}
                className="hidden"
            />
        </div>
    );
}

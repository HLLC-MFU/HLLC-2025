import { Button } from "@heroui/react";
import { Image, Upload, X } from "lucide-react";
import { RefObject, ChangeEvent } from "react";

interface LogoPreviewProps {
    preview: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    onRemove: () => void;
    inputRef: RefObject<HTMLInputElement>;
    aspectRatio?: string;
    maxSize?: string;
    containerClassName?: string;
}

export function LogoPreview({
    preview,
    onFileChange,
    onRemove,
    inputRef,
    aspectRatio = "aspect-video",
    containerClassName = "",
}: LogoPreviewProps) {
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) onFileChange(file);
    };

    return (
        <div className={`space-y-2 ${containerClassName}`}>
            <div className="flex gap-2 w-full">
                <Button
                    className="w-full"
                    color="primary"
                    size="sm"
                    startContent={<Upload size={14} />}
                    variant="flat"
                    onPress={() => inputRef.current?.click()}
                >
                    Upload
                </Button>

                {preview && (
                    <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={onRemove}
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>

            <div
                className={`relative ${aspectRatio} rounded-xl overflow-hidden border border-default-200 bg-default-50 flex items-center justify-center group transition-all duration-200 hover:border-primary/50`}
            >
                {preview ? (
                    <img
                        alt="Preview"
                        className="object-contain max-h-full max-w-full bg-white"
                        src={preview}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                        <Image size={24} />
                        <span className="text-xs">No Logo image uploaded</span>
                    </div>
                )}

                <input
                    ref={inputRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}

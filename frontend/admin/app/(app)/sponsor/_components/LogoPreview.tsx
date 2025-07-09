import { Button } from "@heroui/react";
import { Upload, X } from "lucide-react";
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
            <div className="flex justify-between items-center mb-4">
                <p>Logo</p>
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
                className={`flex justify-center items-center ${aspectRatio} 
                rounded-xl border border-default-200 bg-default-50 transition-all duration-300 
                hover:cursor-pointer hover:bg-default overflow-hidden`}
                onClick={() => inputRef.current?.click()}
            >
                {preview ? (
                    <img className="w-screen h-screen object-contain" src={preview} />
                ) : (
                    <div className="flex flex-col justify-center items-center w-full h-full">
                        <Upload className="w-6 h-6 mb-2 text-default-500" />
                        <p className="text-default-500 text-md font-medium">Upload new Logo</p>
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

            <input
                ref={inputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={handleFileChange}
            />
        </div>
    );
}

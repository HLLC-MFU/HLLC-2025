import { Button, Image } from "@heroui/react";
import { X } from "lucide-react";

type ImagePreviewProps = {
    imagePreview: string | null;
    onRemove: () => void;
    className?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
};

export function ImagePreview({ 
    imagePreview, 
    onRemove, 
    className = "",
    size = "md",
    showLabel = true 
}: ImagePreviewProps) {
    if (!imagePreview) return null;

    const sizeClasses = {
        sm: "w-32 h-32",
        md: "w-48 h-48", 
        lg: "w-64 h-64"
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {showLabel && (
                <span className="text-xs text-default-500">Preview:</span>
            )}
            <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden border border-default-200`}>
                <Image
                    alt="Preview"
                    className="w-full h-full object-cover"
                    src={imagePreview}
                    fallbackSrc="https://via.placeholder.com/192x192?text=No+Image"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={onRemove}
                    >
                        <X size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
} 
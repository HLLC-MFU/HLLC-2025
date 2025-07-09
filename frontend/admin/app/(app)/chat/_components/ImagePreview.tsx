import { Button } from "@heroui/react";

type ImagePreviewProps = {
    imagePreview: string | null;
    onRemove: () => void;
};

export function ImagePreview({ imagePreview, onRemove }: ImagePreviewProps) {
    if (!imagePreview) return null;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-default-500">Preview:</span>
            <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-default-200">
                <img
                    alt="Room preview"
                    className="w-full h-full object-cover"
                    src={imagePreview}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={onRemove}
                    >
                        ×
                    </Button>
                </div>
            </div>
        </div>
    );
} 
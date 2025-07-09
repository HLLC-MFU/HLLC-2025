import { Button } from "@heroui/react";
import { Image, Upload, X } from "lucide-react";
import { RefObject } from "react";

interface ImagePreviewProps {
  label: string;
  preview: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  inputRef: RefObject<HTMLInputElement>;
  aspectRatio?: string;
  maxSize?: string;
  containerClassName?: string;
}

export function ImagePreview({
  label,
  preview,
  file,
  onFileChange,
  onRemove,
  inputRef,
  aspectRatio = "aspect-video",
  maxSize = "max-h-[300px]",
  containerClassName = "",
}: ImagePreviewProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-700">{label}</h4>
        <div className="flex gap-2">
          <Button
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
      </div>

      <div
        className={`relative ${aspectRatio} rounded-xl overflow-hidden border border-default-200 bg-default-50 group transition-all duration-200 hover:border-primary/50`}
      >
        {preview ? (
          <img
            alt="Preview"
            className={`w-full h-full object-contain ${maxSize} bg-white`}
            src={preview}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
            <Image size={24} />
            <span className="text-xs">No image uploaded</span>
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
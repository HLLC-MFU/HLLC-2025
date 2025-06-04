import { Button } from "@heroui/react";
import { CheckCircle, Upload, X } from "lucide-react";

interface ImagePreviewProps {
  label: string;
  preview: string;
  file: File | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  aspectRatio?: string;
}

export function ImagePreview({
  label,
  preview,
  file,
  onFileChange,
  onRemove,
  inputRef,
  aspectRatio = "aspect-video"
}: ImagePreviewProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold capitalize text-lg">{label}</h4>
      <div className={`relative ${aspectRatio} rounded-xl overflow-hidden border-2 border-dashed border-default-200 group hover:border-primary transition-colors`}>
        <label 
          htmlFor={`upload-${label.toLowerCase()}`}
          className="cursor-pointer block w-full h-full"
        >
          {preview ? (
            <div className="w-full h-full bg-default-50 relative group">
              <img
                src={preview}
                alt={label}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-default-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="bg-default-50 p-2 rounded-lg">
                  <Upload className="w-6 h-6 text-default-500" />
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
              <Upload className="w-8 h-8" />
              <span>Click to upload {label.toLowerCase()}</span>
            </div>
          )}
        </label>
        <input
          id={`upload-${label.toLowerCase()}`}
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
          className="hidden"
        />
      </div>
      {file && (
        <div className="flex items-center gap-2 text-xs text-success bg-success-50 p-2 rounded">
          <CheckCircle className="w-3 h-3" />
          <span className="flex-1">📁 {file.name}</span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onRemove}
          >
            <X size={14} />
          </Button>
        </div>
      )}
    </div>
  );
} 
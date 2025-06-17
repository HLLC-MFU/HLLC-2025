import { Button } from "@heroui/button";
import { DatePicker, Input } from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { RefObject, ChangeEvent } from "react";

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

export function LamduanFlowersSetting({
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
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div className={`space-y-4 ${containerClassName}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-700">{label}</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Upload size={14} />}
            onPress={() => inputRef.current?.click()}
          >
            Upload
          </Button>

          {preview && (
            <Button
              size="sm"
              variant="flat"
              color="danger"
              isIconOnly
              onPress={onRemove}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview */}
      <div
        className={`relative ${aspectRatio} rounded-xl overflow-hidden border border-default-200 bg-default-50 group transition-all duration-200 hover:border-primary/50`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className={`w-full h-full object-contain ${maxSize} bg-white`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
            <ImageIcon size={24} />
            <span className="text-xs">No image uploaded</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Youtube URL */}
      <div className="flex w-full flex-wrap md:flex-nowrap mb-2 gap-4">
        <Input
          label="Link Youtube"
          labelPlacement="outside"
          placeholder="https://youtube.com/watch?v=..."
          type="url"
        />
      </div>

      {/* Event Date Range */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <DatePicker
            showMonthAndYearPickers
            label="Event start"
            variant="bordered"
          />
        </div>
        <div className="flex-1">
          <DatePicker
            showMonthAndYearPickers
            label="Event end"
            variant="bordered"
          />
        </div>
      </div>

    </div>
  );
}

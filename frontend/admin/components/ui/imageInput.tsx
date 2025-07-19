import { addToast, Button, Input } from '@heroui/react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

export type ImageInputProps = {
  onChange: (file: File) => void;
  onCancel: () => void;
  title?: ReactNode;
  image?: string;
  onDiscard?: boolean;
  aspectRatio?: string;
  fileAccept?: string;
  sizeLimit?: number;
  isRequired?: boolean;
};

export default function ImageInput({
  onChange,
  onCancel,
  title,
  image,
  onDiscard,
  aspectRatio = 'aspect-square',
  fileAccept = 'image/*',
  sizeLimit = 500 * 1024, // in byte, 1024 byte = 1 KB, 1024 * 1024 byte = 1 MB
  isRequired = false,
}: ImageInputProps) {
  const [error, setError] = useState<boolean>(false);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const imageSrc =
    previewImage ||
    (image && `${process.env.NEXT_PUBLIC_API_URL}/uploads/${image}`);
  const isVideo =
    imageSrc?.endsWith('.mp4') || imageSrc?.startsWith('data:video/mp4');
  const limit =
    sizeLimit >= 1024 * 1024
      ? `${sizeLimit / (1024 * 1024)} MB`
      : `${sizeLimit / 1024} KB`;

  if (onDiscard && previewImage) {
    setPreviewImage('');
  }

  useEffect(() => {
    setError(false);
  }, [imageSrc]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center w-full">
        <p className="flex items-center text-md font-medium h-10 gap-1">{title}</p>
        {previewImage && (
          <Button
            isIconOnly
            className="ml-auto"
            color="danger"
            size="md"
            variant="flat"
            onPress={() => {
              onCancel();
              setPreviewImage('');
            }}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      <div
        className={`
          flex justify-center items-center ${aspectRatio} 
          rounded-xl border ${isRequired ? 'border-red-500 bg-red-100' : 'border-default-200 bg-default-50'} transition-all duration-300 hover:cursor-pointer 
          hover:bg-default overflow-hidden
        `}
        onClick={() => imageRef.current?.click()}
      >
        {error ? (
          <ImageIcon />
        ) : imageSrc ? (
          isVideo ? (
            <video
              controls
              className="w-full h-full object-contain"
              src={imageSrc}
            />
          ) : (
            <img
              src={imageSrc}
              onError={() => setError(true)}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full">
            <Upload className="w-6 h-6 mb-2 text-default-500" />
            <p className="text-default-500 text-md font-medium">
              Upload new image
            </p>
            <p className="text-primary-400 text-sm font-medium">
              {limit} Limit
            </p>
          </div>
        )}
      </div>

      {isRequired && <span className="text-center text-danger">Please upload image</span>}

      <Input
        ref={imageRef}
        accept={fileAccept}
        className="hidden"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > sizeLimit) {
            addToast({
              title: 'File size exceeds limit',
              description: `Please upload a file smaller than ${limit}.`,
              color: 'danger',
              variant: 'solid',
            });
            e.target.value = '';

            return;
          }

          onChange(file);

          const reader = new FileReader();
          reader.onload = () => {
            setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(file);

          e.target.value = '';
        }}
      />
    </div>
  );
}

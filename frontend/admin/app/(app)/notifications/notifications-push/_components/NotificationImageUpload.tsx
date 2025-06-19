import { Button } from '@heroui/button';
import { useState, useEffect, useRef } from 'react';

export function ImageUploader({
  onChange,
  resetSignal,
}: {
  onChange?: (file: File | null, url: string) => void;
  resetSignal?: number;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(file);
      setPreviewUrl(url);
      onChange?.(file, url);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(null);
    setPreviewUrl(null);
    onChange?.(null, '');
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    handleRemoveImage();
  }, [resetSignal]);

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full p-4 shadow flex flex-col items-start gap-4 rounded-lg">
      <label className="text-sm font-medium">Upload Image</label>

      <Button
        type="button"
        onClick={handleChooseFileClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Choose Image
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {previewUrl && (
        <div className="flex items-center gap-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 max-h-20 border rounded-xl"
          />
          <button
            onClick={handleRemoveImage}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

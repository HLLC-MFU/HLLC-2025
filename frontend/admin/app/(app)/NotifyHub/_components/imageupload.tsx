import { useState } from 'react';

export function ImageUploader({
  onChange,
}: {
  onChange?: (file: File, url: string) => void;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      onChange?.(file, URL.createObjectURL(file));
    }
  };

  return (
    <div className="w-full bg-white p-4 shadow flex flex-col items-start gap-4 rounded-lg">
      <label className="text-sm font-medium">Upload Image</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
      />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="mt-2 max-h-48 rounded border"
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input,
  Tooltip, Image
} from "@heroui/react";
import { Upload, Image as ImageIcon } from "lucide-react";

import { Sticker } from "@/types/sticker";

type StickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  sticker?: Sticker;
}

export function StickerModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  sticker
}: StickerModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) {
      setNameEn("");
      setNameTh("");
      setImage(null);
      setPreviewImage(null);
      setImageError(false);
      setErrors({});

      return;
    }

    if (isOpen && mode === "edit" && sticker) {
      setNameEn(sticker.name?.en || "");
      setNameTh(sticker.name?.th || "");
      setImageError(false);
      
      setPreviewImage(sticker.image && !imageError
        ? `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${sticker.image}`
        : `https://ui-avatars.com/api/?name=${sticker.name.en.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=48&font-size=0.4`);
      setErrors({});
    }
  }, [isOpen, mode, sticker]);

  const validationRules: { key: string; value: string; message: string }[] = [
    { key: "nameEn", value: nameEn, message: "Name (English) is required" },
    { key: "nameTh", value: nameTh, message: "Name (Thai) is required" },
  ];

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    validationRules.forEach(({ key, value, message }) => {
      if (!value.trim()) {
        newErrors[key] = message;
      }
    });

    if (mode === "add" && !image) {
      newErrors.image = "Sticker image is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const formData = new FormData();
    formData.append("name.en", nameEn.trim());
    formData.append("name.th", nameTh.trim());

    // Always append image as 'image' field
    if (image instanceof File) {
      console.log('[StickerModal] Uploading image:', image);
      formData.append("image", image);
    }

    onSuccess(formData, mode);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={() => { onClose(); }}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Sticker" : "Edit Sticker"}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              isRequired 
              errorMessage={errors.nameEn} 
              isInvalid={!!errors.nameEn} 
              label="Name (English)"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
            <Input 
              isRequired 
              errorMessage={errors.nameTh} 
              isInvalid={!!errors.nameTh} 
              label="Name (Thai)"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
            />
          </div>

          <div className="flex flex-col items-center">
            <Tooltip content="Click to upload sticker image" placement="top">
              <div
                className={`relative w-full max-w-md h-48 rounded-xl transition-all duration-200 hover:border-primary/50 cursor-pointer group ${
                  errors.image ? "border border-red-500" : "bg-default-50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <Image 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-xl" 
                    src={previewImage}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                    <ImageIcon size={32} />
                    <span className="text-sm">Click to upload sticker image</span>
                  </div>
                )}
                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/30 text-white text-sm font-medium rounded-xl flex-col">
                  <Upload />
                  <span>Upload Image</span>
                </div>
              </div>
            </Tooltip>
            {errors.image && (
              <p className="text-sm text-red-500 text-center mt-2">{errors.image}</p>
            )}
            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={handleImageChange}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => { onClose(); }}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add Sticker" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Image
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

export function StickerModal({ isOpen, onClose, onSuccess, mode, sticker }: StickerModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNameEn("");
      setNameTh("");
      setImage(null);
      setPreviewImage(null);
      return;
    }

    if (isOpen && mode === "edit" && sticker) {
      setNameEn(sticker.name?.en || "");
      setNameTh(sticker.name?.th || "");
      
      if (sticker.image) {
        setPreviewImage(`${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${sticker.image}`);
      }
    }
  }, [isOpen, mode, sticker]);

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameTh.trim()) {
      return;
    }

    if (mode === "add" && !image) {
      return;
    }

    const formData = new FormData();
    formData.append("name.en", nameEn.trim());
    formData.append("name.th", nameTh.trim());

    if (image) {
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

  const isFormValid = nameEn.trim() && nameTh.trim() && (mode === "edit" || image);

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {mode === "add" ? "Add New Sticker" : "Edit Sticker"}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="Name (English)"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              isRequired
            />
            <Input 
              label="Name (Thai)"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              isRequired
            />
          </div>

          <div className="flex flex-col items-center">
            <div
              className="relative w-full max-w-md h-48 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <Image 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-xl" 
                  src={previewImage}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageIcon size={32} />
                  <span className="text-sm">Click to upload sticker image</span>
                </div>
              )}
              <div className="absolute inset-0 hidden hover:flex items-center justify-center bg-black/30 text-white text-sm rounded-xl">
                <div className="flex flex-col items-center gap-1">
                  <Upload size={20} />
                  <span>Upload Image</span>
                </div>
              </div>
            </div>
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
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isDisabled={!isFormValid} onPress={handleSubmit}>
            {mode === "add" ? "Add Sticker" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 
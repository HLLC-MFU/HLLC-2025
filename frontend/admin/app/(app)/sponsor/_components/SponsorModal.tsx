"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";

import { Sponsors } from "@/types/sponsors";
import { SponsorType } from "@/types/sponsors-type";
import { LogoPreview } from "./LogoPreview";

interface SponsorModalProps {
  type: string;
  sponsorTypes: SponsorType[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sponsor: FormData, mode: "add" | "edit") => void;
  sponsor?: Sponsors;
  mode: "add" | "edit";
}

const showOptions = [
  { key: "show", label: "Show on list" },
  { key: "hide", label: "Hide on list" },
];

export function SponsorModal({
  type,
  sponsorTypes,
  isOpen,
  onClose,
  onSuccess,
  sponsor,
  mode,
}: SponsorModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null) as RefObject<HTMLInputElement>;
  const [isShow, setIsShow] = useState(true);
  const [errors, setErrors] = useState({ nameEn: false, nameTh: false, logo: false });

  useEffect(() => {
    if (sponsor && mode === "edit") {
      setNameEn(sponsor.name?.en || "");
      setNameTh(sponsor.name?.th || "");
      setIsShow(sponsor.isShow ?? true);
      setLogoFile(null);
      setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`);
    } else {
      setNameEn("");
      setNameTh("");
      setIsShow(true);
      setLogoFile(null);
      setLogoPreview("");
    }
    setErrors({ nameEn: false, nameTh: false, logo: false });
  }, [sponsor, mode, isOpen]);

  const handleFileChange = (file: File | null) => {
    setLogoFile(file);
    setErrors(prev => ({ ...prev, logo: false }));

    if (!file) {
      setLogoPreview("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const nameEnEmpty = !nameEn.trim();
    const nameThEmpty = !nameTh.trim();
    const logoEmpty = !logoFile && !logoPreview;

    setErrors({ nameEn: nameEnEmpty, nameTh: nameThEmpty, logo: logoEmpty });

    if (nameEnEmpty || nameThEmpty || logoEmpty) return;

    const typeId = sponsorTypes.find((s) => s.name === type)?._id;
    if (!typeId) return;

    const formData = new FormData();
    formData.append("name[en]", nameEn.trim());
    formData.append("name[th]", nameTh.trim());
    formData.append("type", typeId);
    formData.append("isShow", String(isShow));
    if (logoFile) formData.append("photo", logoFile);

    onSuccess(formData || {}, mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent className="max-w-[500px] mx-auto">
        <ModalHeader>{mode === "add" ? "Add New Sponsor" : "Edit Sponsor"}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Input
                isRequired
                label="Sponsor Name (English)"
                placeholder="Enter sponsor name in English"
                value={nameEn}
                onValueChange={(val) => {
                  setNameEn(val);
                  setErrors(prev => ({ ...prev, nameEn: false }));
                }}
                isInvalid={errors.nameEn}
                errorMessage="Please fill out this field."
              />
              <Input
                isRequired
                label="Sponsor Name (Thai)"
                placeholder="Enter sponsor name in Thai"
                value={nameTh}
                onValueChange={(val) => {
                  setNameTh(val);
                  setErrors(prev => ({ ...prev, nameTh: false }));
                }}
                isInvalid={errors.nameTh}
                errorMessage="Please fill out this field."
              />
              <Select
                isRequired
                className="w-full"
                selectedKeys={[isShow ? "show" : "hide"]}
                items={showOptions}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];
                  if (key === "show") {
                    setIsShow(true);
                  } else if (key === "hide") {
                    setIsShow(false);
                  }
                }}
                label="Show"
                placeholder="Select show"
              >
                {showOptions.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col items-center w-full px-6">
              <div className="w-full">
                <LogoPreview
                  preview={logoPreview}
                  file={logoFile}
                  onFileChange={handleFileChange}
                  onRemove={() => handleFileChange(null)}
                  inputRef={logoInputRef}
                  aspectRatio="aspect-[6/3]"
                  maxSize="max-h-[100px]"
                  containerClassName="w-full"
                />
              </div>
              {errors.logo && (
                <p className="mt-2 text-center text-danger text-sm">
                  Please upload a logo image.
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

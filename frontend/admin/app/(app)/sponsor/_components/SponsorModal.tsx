"use client";
import { useSponsor } from "@/hooks/useSponsor";
import { Sponsor, Type } from "@/types/sponsor";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import { useState, useEffect } from "react";

interface SponsorModalProps {
  type: string;
  sponsorTypes: Type[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sponsor: Partial<Sponsor>, mode: "add" | "edit") => void;
  sponsor?: Sponsor;
  mode: "add" | "edit";
}

export const show = [
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
  mode
}: SponsorModalProps) {
  const { createSponsor, updateSponsor } = useSponsor();
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isShow, setIsShow] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    } else {
      setLogoFile(null);
    }
  };

  useEffect(() => {
    if (sponsor) {
      setNameEn(sponsor.name.en);
      setNameTh(sponsor.name.th);
    } else {
      setNameEn("");
      setNameTh("");
    }
  }, [sponsor]);

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const typeId = sponsorTypes.find((s) => s.name === type)?._id;
    if (!typeId) {
      console.error("Invalid type selected:", type);
      return;
    }

    const formData = new FormData();
    formData.append("name[en]", nameEn.trim());
    formData.append("name[th]", nameTh.trim());
    formData.append("type", typeId);
    formData.append("isShow", String(isShow));
    if (logoFile) {
      if (logoFile) formData.append("photo.logoPhoto", logoFile);
    }

    try {
      if (mode === "add") {
        await createSponsor(formData);
      } else if (mode === "edit" && sponsor?._id) {
        await updateSponsor(sponsor._id, formData);
      }

      onSuccess(sponsor || {}, mode);
      onClose();
    } catch (err) {
      console.error("Error in sponsor submission", err);
    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Sponsor" : "Edit Sponsor"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sponsor Name (English)"
                placeholder="Enter sponsor name in English"
                value={nameEn}
                onValueChange={setNameEn}
              />
              <Input
                label="Sponsor Name (Thai)"
                placeholder="Enter sponsor name in Thai"
                value={nameTh}
                onValueChange={setNameTh}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                isRequired
                className="max-w-xs"
                defaultSelectedKeys={["show"]}
                items={show}
                label="Show"
                placeholder="Select show"
              >
                {show.map((show) => (
                  <SelectItem key={show.key}>{show.label}</SelectItem>
                ))}
              </Select>

              <div className="flex flex-col w-full">
                <label htmlFor="logo-upload" className="text-sm font-medium text-default-600 mb-1">
                  Logo Image
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-default-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-white
                              hover:file:bg-primary/90
                              cursor-pointer"
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
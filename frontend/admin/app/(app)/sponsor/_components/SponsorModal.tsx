"use client";

import { useState, useEffect } from "react";
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

import { useSponsors } from "@/hooks/useSponsors";
import { Sponsors } from "@/types/sponsors";
import { SponsorType } from "@/types/sponsors-type";

interface SponsorModalProps {
  type: string;
  sponsorTypes: SponsorType[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sponsor: Partial<Sponsors>, mode: "add" | "edit") => void;
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
  const { createSponsors, updateSponsors } = useSponsors();

  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isShow, setIsShow] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  useEffect(() => {
    if (sponsor && mode === "edit") {
      setNameEn(sponsor.name?.en || "");
      setNameTh(sponsor.name?.th || "");
      setIsShow(sponsor.isShow ?? true);
      setLogoFile(null);
    } else {
      setNameEn("");
      setNameTh("");
      setIsShow(true);
      setLogoFile(null);
    }
  }, [sponsor, mode, isOpen]);

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const typeId = sponsorTypes.find((s) => s.name === type)?._id;
    if (!typeId) return;

    const formData = new FormData();
    formData.append("name[en]", nameEn.trim());
    formData.append("name[th]", nameTh.trim());
    formData.append("type", typeId);
    formData.append("isShow", String(isShow));
    if (logoFile) formData.append("photo", logoFile);

    try {
      if (mode === "add") {
        await createSponsors(formData);
      } else if (sponsor?._id) {
        await updateSponsors(sponsor._id, formData);
      }

      onSuccess(sponsor || {}, mode);
      onClose();
    } catch (err) {
      console.error("Sponsor submission error:", err);
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
                selectedKeys={[isShow ? "show" : "hide"]}
                items={showOptions}
                onChange={(e) =>
                  setIsShow((e.target as HTMLSelectElement).value === "show")
                }
                label="Show"
                placeholder="Select show"
              >
                {showOptions.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>

              <div className="flex flex-col w-full">
                <label
                  htmlFor="logo-upload"
                  className="text-sm font-medium text-default-600 mb-1"
                >
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
                {mode === "edit" && sponsor?.photo && !logoFile && (
                  <p className="mt-2 text-sm text-default-500 italic">
                    Current file:{" "}
                    <span className="font-medium">{sponsor.photo}</span>
                  </p>
                )}
                {logoFile && (
                  <p className="mt-2 text-sm text-default-500 italic">
                    Selected file:{" "}
                    <span className="font-medium">{logoFile.name}</span>
                  </p>
                )}
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

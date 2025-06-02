"use client";
import { Sponsor } from "@/types/sponsor";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import { useState, useEffect } from "react";

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sponsor: Partial<Sponsor>, mode: "add" | "edit") => void;
  sponsor?: Sponsor;
  mode: "add" | "edit";
}

export const types = [
  {key: "normal", label: "Normal"},
  {key: "scan", label: "Scan"},
];

export const show = [
  {key: "show", label: "Show on list"},
  {key: "hide", label: "Hide on list"},
];

export function SponsorModal({
  isOpen,
  onClose,
  onSuccess,
  sponsor,
  mode
}: SponsorModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [detailTh, setDetailTh] = useState("");

  useEffect(() => {
    if (sponsor) {
      setNameEn(sponsor.name.en);
      setNameTh(sponsor.name.th);
      setDetailEn(sponsor.description.en);
      setDetailTh(sponsor.description.th);
    } else {
      setNameEn("");
      setNameTh("");
      setDetailEn("");
      setDetailTh("");
    }
  }, [sponsor]);

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const updatedSponsor: Partial<Sponsor> = {
      ...sponsor,
      name: { en: nameEn.trim(), th: nameTh.trim() },
      description: { en: detailEn.trim(), th: detailTh.trim() }
    };

    onSuccess(updatedSponsor, mode);
    onClose();
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
              <Textarea
                label="Description (English)"
                placeholder="Enter description in English"
                value={detailEn}
                onValueChange={setDetailEn}
                minRows={4}
              />
              <Textarea
                label="Description (Thai)"
                placeholder="Enter description in Thai"
                value={detailTh}
                onValueChange={setDetailTh}
                minRows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                isRequired
                className="max-w-xs"
                defaultSelectedKeys={["normal"]}
                items={types}
                label="Select type"
                placeholder="Select type"
              >
                {types.map((types) => (
                  <SelectItem key={types.key}>{types.label}</SelectItem>
                ))}
              </Select>
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
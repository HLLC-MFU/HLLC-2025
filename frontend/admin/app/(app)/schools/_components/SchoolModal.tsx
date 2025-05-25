"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";
import { useState, useEffect } from "react";
import type { School } from "@/types/school";

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (school: Partial<School>, mode: "add" | "edit") => void;
  school?: School;
  mode: "add" | "edit";
}

export function SchoolModal({
  isOpen,
  onClose,
  onSuccess,
  school,
  mode
}: SchoolModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [detailTh, setDetailTh] = useState("");
  const [acronym, setAcronym] = useState("");

  useEffect(() => {
    if (school) {
      setNameEn(school.name?.en || "");
      setNameTh(school.name?.th || "");
      setDetailEn(school.detail?.en || "");
      setDetailTh(school.detail?.th || "");
      setAcronym(school.acronym || "");
    } else {
      setNameEn("");
      setNameTh("");
      setDetailEn("");
      setDetailTh("");
      setAcronym("");
    }
  }, [school]);

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const updatedSchool: Partial<School> = {
      ...school,
      name: { en: nameEn.trim(), th: nameTh.trim() },
      detail: { en: detailEn.trim(), th: detailTh.trim() },
      acronym: acronym.trim() || nameEn.substring(0, 3).toUpperCase()
    };

    onSuccess(updatedSchool, mode); // pass back to parent
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New School" : "Edit School"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="School Name (English)"
                placeholder="Enter school name in English"
                value={nameEn}
                onValueChange={setNameEn}
              />
              <Input
                label="School Name (Thai)"
                placeholder="Enter school name in Thai"
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
            <Input
              label="Acronym"
              placeholder="Enter school acronym"
              value={acronym}
              onValueChange={setAcronym}
            />
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

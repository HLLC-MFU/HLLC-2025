import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";
import { useState, useEffect } from "react";
import type { Major } from "@/types/school";
import { apiRequest } from "@/utils/api";

interface MajorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (major: Major, mode: "add" | "edit") => void;
  major?: Major;
  mode: "add" | "edit";
  school: string;
}

export function MajorModal({
  isOpen,
  onClose,
  onSuccess,
  major,
  mode,
  school
}: MajorModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [detailTh, setDetailTh] = useState("");
  const [acronym, setAcronym] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (major) {
      setNameEn(major.name.en);
      setNameTh(major.name.th);
      setDetailEn(major.detail.en);
      setDetailTh(major.detail.th);
      setAcronym(major.acronym);
    } else {
      setNameEn("");
      setNameTh("");
      setDetailEn("");
      setDetailTh("");
      setAcronym("");
    }
  }, [major]);

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const majorData: Partial<Major> = {
      name: { en: nameEn.trim(), th: nameTh.trim() },
      detail: { en: detailEn.trim(), th: detailTh.trim() },
      acronym: acronym.trim() || nameEn.substring(0, 3).toUpperCase(),
      school: school
    };

    try {
      setLoading(true);
      let res;
      if (mode === "add") {
        res = await apiRequest(`/majors`, "POST", majorData);
      } else if (mode === "edit" && major?._id) {
        res = await apiRequest(`/majors/${major._id}`, "PATCH", majorData);
      }

      if (res?.data) {
        onSuccess(res.data as Major, mode);
        onClose();
      }
    } catch (err) {
      console.error("API error:", err);
      // Optional: toast or UI feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Major" : "Edit Major"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Major Name (English)"
                placeholder="Enter major name in English"
                value={nameEn}
                onValueChange={setNameEn}
              />
              <Input
                label="Major Name (Thai)"
                placeholder="Enter major name in Thai"
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
                minRows={3}
              />
              <Textarea
                label="Description (Thai)"
                placeholder="Enter description in Thai"
                value={detailTh}
                onValueChange={setDetailTh}
                minRows={3}
              />
            </div>
            <Input
              label="Acronym"
              placeholder="Enter major acronym"
              value={acronym}
              onValueChange={setAcronym}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

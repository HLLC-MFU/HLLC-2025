import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  addToast,
} from "@heroui/react";
import { useState, useEffect } from "react";

import { apiRequest } from "@/utils/api";
import { Major } from "@/types/major";
import { School } from "@/types/school";

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
  school,
}: MajorModalProps) {
  const [majorState, setMajorState] = useState<Partial<Major>>({
    name: { en: "", th: "" },
    detail: { en: "", th: "" },
    acronym: "",
    school: school,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (major) {
      setMajorState({
        name: { ...major.name },
        detail: { ...major.detail },
        acronym: major.acronym,
        school: major.school,
      });
    } else {
      setMajorState({
        name: { en: "", th: "" },
        detail: { en: "", th: "" },
        acronym: "",
        school,
      });
    }
  }, [major, school]);

  const handleChange = (field: string, value: string, subfield?: string) => {
    if (subfield) {
      setMajorState((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field as keyof Major] as any),
          [subfield]: value,
        },
      }));
    } else {
      setMajorState((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!majorState.name?.en?.trim() || !majorState.name?.th?.trim()) return;

    const majorData: Partial<Major> = {
      ...majorState,
      acronym:
        majorState.acronym?.trim() ||
        majorState.name.en.substring(0, 3).toUpperCase(),
      school,
    };

    try {
      setLoading(true);
      const res =
        mode === "add"
          ? await apiRequest(`/majors`, "POST", majorData)
          : await apiRequest(`/majors/${major?._id}`, "PATCH", majorData);

      if (res?.data) {
        onSuccess(res.data as Major, mode);
        onClose();
      }
    } catch (err) {
      addToast({
        title: "Error",
        description: (err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to save major. Please try again."),
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
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
                value={majorState.name?.en || ""}
                onValueChange={(val) => handleChange("name", val, "en")}
              />
              <Input
                label="Major Name (Thai)"
                placeholder="Enter major name in Thai"
                value={majorState.name?.th || ""}
                onValueChange={(val) => handleChange("name", val, "th")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Description (English)"
                minRows={3}
                placeholder="Enter description in English"
                value={majorState.detail?.en || ""}
                onValueChange={(val) => handleChange("detail", val, "en")}
              />
              <Textarea
                label="Description (Thai)"
                minRows={3}
                placeholder="Enter description in Thai"
                value={majorState.detail?.th || ""}
                onValueChange={(val) => handleChange("detail", val, "th")}
              />
            </div>
            <Input
              label="Acronym"
              placeholder="Enter major acronym"
              value={majorState.acronym || ""}
              onValueChange={(val) => handleChange("acronym", val)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            disabled={loading}
            variant="light"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button color="primary" isLoading={loading} onPress={handleSubmit}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

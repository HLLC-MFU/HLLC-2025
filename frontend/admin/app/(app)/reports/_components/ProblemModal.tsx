"use client";

import type { Report, ReportTypes } from "@/types/report";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState, useEffect } from "react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Report) => void;
  report?: Report;
  categories: ReportTypes[];
}

export function ProblemModal({
  isOpen,
  onClose,
  onSubmit,
  report,
  categories,
}: ReportModalProps) {
  const [message, setMessage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<Report["status"]>("pending");

  useEffect(() => {
    if (report) {
      setMessage(report.message);
      setCategoryId(report.category._id);
      setStatus(report.status);
    } else {
      setMessage("");
      setCategoryId(categories[0]?._id ?? "");
      setStatus("pending");
    }
  }, [report, categories]);

  const handleSubmit = () => {
    if (!message.trim() || !categoryId || !report) return;

    const updatedReport: Report = {
      ...report,
      message: message.trim(),
      category: categories.find((category) => category._id === categoryId)!,
      status,
      updatedAt: new Date().toISOString(),
    };

    onSubmit(updatedReport);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Edit Report</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Textarea
              label="Message"
              minRows={4}
              placeholder="Enter report message"
              value={message}
              onValueChange={setMessage}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                selectedKeys={[categoryId]}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((category) => (
                  <SelectItem key={category._id}>
                    {category.name.en}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Status"
                selectedKeys={[status]}
                onChange={(e) =>
                  setStatus(e.target.value as Report["status"])
                }
              >
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="in-progress">In-Progress</SelectItem>
                <SelectItem key="done">Done</SelectItem>
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isDisabled={!report}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

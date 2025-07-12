"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Alert,
  DateRangePicker,
} from "@heroui/react";
import { useState } from "react";

type CampaignStatus = "draft" | "active" | "completed";

interface CampaignCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData) => void;
}

export const CampaignCreateDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: CampaignCreateDialogProps) => {
  const [formData, setFormData] = useState({
    nameTh: "",
    nameEn: "",
    detailTh: "",
    detailEn: "",
    startAt: "",
    endAt: "",
    budget: "0",
    status: "draft" as CampaignStatus,
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{
    message: string;
    details?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data = new FormData();
      
      // Add name fields
      data.append("name[th]", formData.nameTh);
      data.append("name[en]", formData.nameEn);
      
      // Add detail fields
      data.append("detail[th]", formData.detailTh);
      data.append("detail[en]", formData.detailEn);
      
      // Add other fields
      data.append("startAt", formData.startAt);
      data.append("endAt", formData.endAt);
      data.append("budget", formData.budget);
      data.append("status", formData.status);
      
      // Add image if exists
      if (formData.image) {
        data.append("image", formData.image);
      }

      await onSuccess(data);
      onClose();
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      
      // Handle different error cases
      let errorMessage = "เกิดข้อผิดพลาดในการสร้างแคมเปญ";
      let errorDetails = "กรุณาลองใหม่อีกครั้ง";

      if (error?.response?.status === 403) {
        errorMessage = "ไม่มีสิทธิ์ในการสร้างแคมเปญ";
        errorDetails = "กรุณาติดต่อผู้ดูแลระบบ";
      } else if (error?.response?.status === 500) {
        errorMessage = "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์";
        errorDetails = "กรุณาลองใหม่อีกครั้งในภายหลัง";
      } else if (error?.response?.data?.message) {
        errorDetails = error.response.data.message;
      } else if (error?.message) {
        errorDetails = error.message;
      }

      setError({
        message: errorMessage,
        details: errorDetails
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create New Campaign</ModalHeader>
          <ModalBody>
            {error && (
              <Alert
                className="mb-4"
                color="danger"
                variant="flat"
                onClose={() => setError(null)}
              >
                <div className="flex flex-col gap-1">
                  <div>{error.message}</div>
                  {error.details && (
                    <div className="text-sm opacity-80">{error.details}</div>
                  )}
                </div>
              </Alert>
            )}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Input
                  isRequired
                  label="Campaign Name (TH)"
                  value={formData.nameTh}
                  onChange={(e) =>
                    setFormData({ ...formData, nameTh: e.target.value })
                  }
                />
                <Input
                  isRequired
                  label="Campaign Name (EN)"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4">
                <Textarea
                  label="Description (TH)"
                  value={formData.detailTh}
                  onChange={(e) =>
                    setFormData({ ...formData, detailTh: e.target.value })
                  }
                />
                <Textarea
                  label="Description (EN)"
                  value={formData.detailEn}
                  onChange={(e) =>
                    setFormData({ ...formData, detailEn: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4">
                <DateRangePicker
                  className="w-full"
                  description="Please select campaign start and end dates"
                  firstDayOfWeek="mon"
                  label="Campaign Duration"
                  onChange={(range) => {
                    if (range) {
                      setFormData({
                        ...formData,
                        startAt: range.start.toString(),
                        endAt: range.end.toString()
                      });
                    }
                  }}
                />
              </div>
              <Input
                isRequired
                label="Budget (THB)"
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
              />
              <Input
                accept="image/*"
                label="Campaign Image"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setFormData({ ...formData, image: file });
                  }
                }}
              />
              <Select
                label="Status"
                selectedKeys={[formData.status]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CampaignStatus,
                  })
                }
              >
                <SelectItem key="draft">Draft</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}; 
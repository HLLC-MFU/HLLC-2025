"use client";

import { Campaign } from "@/types/campaign";
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
} from "@heroui/react";
import { useEffect, useState } from "react";

type CampaignStatus = "draft" | "active" | "completed";

interface CampaignUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaignData: Partial<Campaign>) => void;
  campaign: Campaign | undefined;
}

export const CampaignUpdateDialog = ({
  isOpen,
  onClose,
  onSuccess,
  campaign,
}: CampaignUpdateDialogProps) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: 0,
    status: "draft",
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
        status: campaign.status,
      });
    }
  }, [campaign]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Update Campaign</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Campaign Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                isRequired
              />
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <div className="flex gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  isRequired
                />
                <Input
                  type="date"
                  label="End Date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  isRequired
                />
              </div>
              <Input
                type="number"
                label="Budget (THB)"
                value={formData.budget?.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, budget: Number(e.target.value) })
                }
                isRequired
              />
              <Select
                label="Status"
                selectedKeys={[formData.status as string]}
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
            <Button color="default" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Update Campaign
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}; 
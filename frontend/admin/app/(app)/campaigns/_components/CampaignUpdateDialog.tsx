'use client';

import { Campaign } from '@/types/campaign';
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
} from '@heroui/react';
import { useEffect, useState } from 'react';

type CampaignStatus = 'draft' | 'active' | 'completed';

interface CampaignUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData) => void;
  campaign: Campaign | undefined;
}

export const CampaignUpdateDialog = ({
  isOpen,
  onClose,
  onSuccess,
  campaign,
}: CampaignUpdateDialogProps) => {
  const [formData, setFormData] = useState<
    Partial<Campaign> & { newImage?: File }
  >({
    name: {
      th: '',
      en: '',
    },
    detail: {
      th: '',
      en: '',
    },
    startAt: '',
    endAt: '',
    budget: 0,
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        detail: campaign.detail,
        startAt: campaign.startAt,
        endAt: campaign.endAt,
        budget: campaign.budget,
        status: campaign.status,
        image: campaign.image,
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data = new FormData();

      // Add name fields
      data.append('name[th]', formData.name?.th || '');
      data.append('name[en]', formData.name?.en || '');

      // Add detail fields
      data.append('detail[th]', formData.detail?.th || '');
      data.append('detail[en]', formData.detail?.en || '');

      // Add other fields
      data.append('startAt', formData.startAt || '');
      data.append('endAt', formData.endAt || '');
      data.append('budget', formData.budget?.toString() || '0');
      data.append('status', formData.status || 'draft');

      // Add image if exists
      if (formData.newImage) {
        data.append('image', formData.newImage);
      }

      await onSuccess(data);
      onClose();
    } catch (error: any) {
      console.error('Error updating campaign:', error);

      // Handle different error cases
      let errorMessage = 'เกิดข้อผิดพลาดในการอัปเดตแคมเปญ';
      let errorDetails = 'กรุณาลองใหม่อีกครั้ง';

      if (error?.response?.status === 404) {
        errorMessage = 'ไม่พบแคมเปญที่ต้องการอัปเดต';
        errorDetails = 'แคมเปญอาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ';
      } else if (error?.response?.status === 403) {
        errorMessage = 'ไม่มีสิทธิ์ในการอัปเดตแคมเปญ';
        errorDetails = 'กรุณาติดต่อผู้ดูแลระบบ';
      } else if (error?.response?.status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
        errorDetails = 'กรุณาลองใหม่อีกครั้งในภายหลัง';
      } else if (error?.response?.data?.message) {
        errorDetails = error.response.data.message;
      } else if (error?.message) {
        errorDetails = error.message;
      }

      setError({
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Update Campaign</ModalHeader>
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
              <Input
                label="Campaign Name"
                value={formData.name?.th}
                onChange={e =>
                  setFormData({
                    ...formData,
                    name: { ...formData.name, th: e.target.value },
                  } as Partial<Campaign>)
                }
                isRequired
              />
              <Input
                label="Campaign Name (English)"
                value={formData.name?.en}
                onChange={e =>
                  setFormData({
                    ...formData,
                    name: { ...formData.name, en: e.target.value },
                  } as Partial<Campaign>)
                }
              />
              <Textarea
                label="Description"
                value={formData.detail?.th}
                onChange={e =>
                  setFormData({
                    ...formData,
                    detail: { ...formData.detail, th: e.target.value },
                  } as Partial<Campaign>)
                }
              />
              <Textarea
                label="Description (English)"
                value={formData.detail?.en}
                onChange={e =>
                  setFormData({
                    ...formData,
                    detail: { ...formData.detail, en: e.target.value },
                  } as Partial<Campaign>)
                }
              />
              <div className="flex gap-4">
                <DateRangePicker
                  label="Campaign Duration"
                  description="Please select campaign start and end dates"
                  firstDayOfWeek="mon"
                  className="w-full"
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
                type="number"
                label="Budget (THB)"
                value={formData.budget?.toString()}
                onChange={e =>
                  setFormData({ ...formData, budget: Number(e.target.value) })
                }
                isRequired
              />
              <Input
                type="file"
                label="Campaign Image"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({ ...prev, newImage: file }));
                  }
                }}
                accept="image/*"
              />
              <Select
                label="Status"
                selectedKeys={[formData.status as string]}
                onChange={e =>
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
              type="submit"
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Campaign'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

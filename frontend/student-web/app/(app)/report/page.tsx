'use client';

import {
  Button,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  addToast,
  Modal,
  ModalBody,
  ModalContent,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useReport } from '@/hooks/useReport';
import { ConfirmModal } from './_components/ModalComfirm';
import { useTranslation } from 'react-i18next';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isModalConfirmOpen, setIsModalConfirmOpen] = useState(false);
  const DESCRIPTION_LIMIT = 300;

  const {
    reporttypes,
    loading,
    error,
    submitReport,
  } = useReport();

  const handleClose = () => {
    setSelectedTopic('');
    setDescription('');
    onClose();
  };


  const handleSubmit = () => {
    if (!selectedTopic || !description.trim()) return;
    setIsModalConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsModalConfirmOpen(false);
    const success = await submitReport({
      category: selectedTopic,
      message: description.trim(),
    });

    if (success) {
      setSelectedTopic('');
      setDescription('');
      onClose();
    } else {
      addToast({
        title: 'Error',
        description: error || 'Cannot send the report',
        color: 'danger',
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        placement="center"
        className="flex items-center justify-center bg-black/40 z-50"
        hideCloseButton
      >
        <ModalContent className="w-[350px] py-6 bg-white/10 backdrop-blur-md border border-white/60 rounded-3xl shadow-2xl">
          <ModalBody className="w-full space-y-6">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h2 className="text-2xl font-semibold text-white">{t('report.title')}</h2>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white">{t('report.topic')}</label>
              <Select
                aria-label="Choose Topic"
                selectedKeys={selectedTopic ? [selectedTopic] : []}
                placeholder={t('report.topicChoose')}
                isDisabled={loading}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {reporttypes.map((t) => (
                  <SelectItem key={t.id} textValue={`${t.name.en} (${t.name.th})`}>
                    {t.name.en} ({t.name.th})
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white">{t('report.description')}</label>
              <Textarea
                placeholder={t('report.descriptionText')}
                value={description}
                maxLength={DESCRIPTION_LIMIT}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-sm text-right text-white/50">
                {description.length}/{DESCRIPTION_LIMIT}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 pt-2">
              <Button
                onPress={handleClose}
                className="w-full py-2 bg-danger hover:bg-gray-600 text-white font-bold rounded-full"
              >
                {t('report.cancel')}
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={!selectedTopic || !description.trim() || loading}
                className="w-full py-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-full transition-opacity duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {t('report.confirm')}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isModalConfirmOpen}
        onCancel={() => setIsModalConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}

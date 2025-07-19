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

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
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
        onClose={onClose}
        placement="center"
        className="flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      >
        <ModalContent className="w-[350px] py-6 bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
          <ModalBody className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h2 className="text-2xl font-semibold text-black/80">Report</h2>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-black/70">Topic</label>
              <Select
                selectedKeys={selectedTopic ? [selectedTopic] : []}
                placeholder="Choose Topic"
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
              <label className="text-sm font-medium text-black/70">Description</label>
              <Textarea
                placeholder="Description"
                value={description}
                maxLength={DESCRIPTION_LIMIT}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-sm text-right text-black/50">
                {description.length}/{DESCRIPTION_LIMIT}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 pt-2">
              <Button
                onPress={handleClose}
                className="w-full py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full"
              >
                CLOSE
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={!selectedTopic || !description.trim() || loading}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-opacity duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Spinner size="sm" /> : 'CONFIRM'}
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

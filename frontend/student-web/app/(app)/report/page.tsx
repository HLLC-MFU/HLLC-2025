'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  addToast,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import { useReport } from '@/hooks/useReport';
import { ReportSkeleton } from './_components/ReportSkeleton';
import { ConfirmModal } from './_components/ModalComfirm';

export default function ReportPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const DESCRIPTION_LIMIT = 144;

  const {
    reporttypes,
    loading,
    error,
    submitReport,
  } = useReport();

  const handleSubmit = () => {
    if (!selectedTopic || !description.trim()) return;
    setIsModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsModalOpen(false);
    const success = await submitReport({
      category: selectedTopic,
      message: description.trim(),
    });

    if (success) {
      addToast({ title: 'Report submitted successfully', color: 'success' });
      setSelectedTopic('');
      setDescription('');
    } else {
      addToast({
        title: 'Error',
        description: error || 'Cannot send the report',
        color: 'danger',
      });
    }
  };

  if (loading && reporttypes.length === 0) {
    return <ReportSkeleton />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent px-4">
      <Card className="w-full max-w-xl py-6 px-6 bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg">
        <CardBody className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Report</h2>
          </div>

          {/* Select Topic */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Topics</label>
            <Select
              selectedKeys={selectedTopic ? [selectedTopic] : []}
              placeholder="Choose Topic"
              isDisabled={loading}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {reporttypes.map((t) => (
                <SelectItem
                  key={t.id}
                  textValue={`${t.name.en} (${t.name.th})`}
                >
                  {t.name.en} ({t.name.th})
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Description</label>
            <Textarea
              placeholder="Write a message..."
              value={description}
              maxLength={DESCRIPTION_LIMIT}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-right text-white/60">
              {description.length}/{DESCRIPTION_LIMIT}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onPress={() => {
                setSelectedTopic('');
                setDescription('');
              }}
              className="text-white"
            >
              Clear
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!selectedTopic || !description.trim() || loading}
              color="primary"
              className={`transition-opacity duration-300 ${!selectedTopic || !description.trim() || loading
                ? 'opacity-50 pointer-events-none'
                : 'opacity-100'
                }`}
            >
              {loading ? <Spinner size="sm" /> : 'Submit'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}

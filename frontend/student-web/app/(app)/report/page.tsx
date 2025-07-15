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
  const DESCRIPTION_LIMIT = 300;

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
    <div className="fixed inset-0 flex items-center justify-center bg-transparent px-4 z-50">
      <Card className="w-full max-w-xl py-6 px-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
        <CardBody className="space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h2 className="text-2xl font-semibold text-black/80">Report</h2>
          </div>

          {/* Select Topic */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-black/70">Topic</label>
            <Select
              selectedKeys={selectedTopic ? [selectedTopic] : []}
              placeholder="Choose Topic"
              isDisabled={loading}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white placeholder-white/50 rounded-xl"
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
            <label className="text-sm font-medium text-black/70">Description</label>
            <Textarea
              placeholder="Description"
              value={description}
              maxLength={DESCRIPTION_LIMIT}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white placeholder-white/50 rounded-xl"
            />
            <p className="text-sm text-right text-white/60">
              {description.length}/{DESCRIPTION_LIMIT}
            </p>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-10 pt-2">
            <Button
              onPress={() => {
                setSelectedTopic('');
                setDescription('');
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full"
            >
              CLEAR
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!selectedTopic || !description.trim() || loading}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-opacity duration-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Spinner size="sm" /> : 'CONFIRM'}
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

'use client';
import { useState } from 'react';
import { QrCodeScanner } from './_components/QrCodeScanner';
import Selectdropdown from './_components/SelectDropdown';
import { PageHeader } from '@/components/ui/page-header';
import { UserRound } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import Input from './_components/Input';
import { useCheckin } from '@/hooks/useCheckin';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/react';

export default function CheckinPage() {
  const [selectedActivityId, setSelectedActivityId] = useState<string[]>([]);
  const { activities } = useActivities({ autoFetch: true, useCanCheckin: true });
  const [activeTab, setActiveTab] = useState<'scan' | 'typing'>('scan');
  const [studentId, setStudentId] = useState('');
  const { createCheckin } = useCheckin();

const handleSubmit = async (id?: string) => {
  const sid = id ?? studentId;

  if (!/^\d{10}$/.test(sid)) {
    return addToast({
      title: 'Invalid studentId',
      description: 'Please enter your 10-digit student ID number.',
      color: 'danger',
    });
  }

  if (selectedActivityId.length === 0) {
    return addToast({
      title: 'No select Activities',
      description: 'Please select activities before checkin.',
      color: 'warning',
    });
  }

  const result = await createCheckin({
    user: sid,
    activities: selectedActivityId,
  });

  if (result) {
    setStudentId('');
  }
};


  return (
    <>
      <PageHeader description="This is Management Page" icon={<UserRound />} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-center items-center gap-5">
          {/* fetch จาก canCheckin */}
          <Selectdropdown
            selectedActivityId={selectedActivityId}
            setSelectActivityId={setSelectedActivityId}
            activities={activities}
          />
          <div className="flex justify-between gap-5 w-full">
            <Button
              variant={activeTab === 'scan' ? 'solid' : 'flat'}
              radius="md"
              onPress={() => setActiveTab('scan')}
              className="text-center font-bold text-xs w-full"
            >
              Scan
            </Button>
            <Button
              variant={activeTab === 'typing' ? 'solid' : 'flat'}
              radius="md"
              onPress={() => setActiveTab('typing')}
              className="text-center font-bold text-xs w-full"
            >
              Typing
            </Button>
          </div>
        </div>
        {activeTab === 'scan' ? (
          <QrCodeScanner
            selectedActivityId={selectedActivityId}
            onCheckin={handleSubmit}
          />
        ) : (
          <Input
            onSubmit={() => handleSubmit()}
            studentId={studentId}
            setStudentId={setStudentId}
          />
        )}
      </div>
    </>
  );
}

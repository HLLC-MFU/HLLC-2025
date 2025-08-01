'use client';
import { useState, useEffect } from 'react';
import { QrCodeScanner } from './_components/QrCodeScanner';
import Selectdropdown from './_components/SelectDropdown';
import { PageHeader } from '@/components/ui/page-header';
import { useActivities } from '@/hooks/useActivities';
import Input from './_components/Input';
import { useCheckin } from '@/hooks/useCheckin';
import { Button } from '@heroui/button';
import { addToast, Switch } from '@heroui/react';
import { UserRound, Volume2, VolumeOff } from 'lucide-react';

export default function CheckinPage() {
  const [selectedActivityId, setSelectedActivityId] = useState<string[]>([]);
  const { activities } = useActivities({ autoFetch: true, useCanCheckin: true });
  const [activeTab, setActiveTab] = useState<'scan' | 'typing'>('scan');
  const [studentId, setStudentId] = useState('');
  const { createCheckin } = useCheckin(null);
  const [onSound, setOnSound] = useState(false)

  useEffect(() => {
  }, [selectedActivityId]);

  const handleSubmit = async (id?: string, activityIds?: string[]) => {
    const sid = id ?? studentId;
    const activitiesToSend = activityIds ?? selectedActivityId;

    if (activitiesToSend.length === 0) {
      addToast({
        title: 'No select Activities',
        description: 'Please select activities before checkin.',
        color: 'warning',
      });
      return
    }

    const result = await createCheckin({
      user: sid,
      activities: activitiesToSend,
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
          <>
            <Switch
              isSelected={onSound}
              onValueChange={(value) => setOnSound(value)}
              color="success"
              size="lg"
              thumbIcon={({ isSelected, className }) =>
                isSelected ? (
                  <Volume2 className={className} size={15} />
                ) : (
                  <VolumeOff className={className} size={15} />
                )
              } />
            <QrCodeScanner
              key={`scanner-${onSound}`}
              selectedActivityId={selectedActivityId}
              onCheckin={(studentId, selectedActivityId) => handleSubmit(studentId, selectedActivityId)}
              sound={onSound}
            />
          </>
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

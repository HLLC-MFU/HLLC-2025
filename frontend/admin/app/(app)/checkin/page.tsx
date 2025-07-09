'use client';
import { useState } from 'react';
import { UserRound } from 'lucide-react';

import { QrCodeScanner } from './_components/QrCodeScanner';
import Selectdropdown from './_components/Select';

import { PageHeader } from '@/components/ui/page-header';
import { UserRound } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import Input from './_components/Input';
import { addToast, Button } from '@heroui/react';
import { useCheckin } from '@/hooks/useCheckin';

export default function CheckinPage() {
  const [selectedActivityId, setSelectedActivityId] = useState<string[]>([]);
  const { activities } = useActivities();
  const [activeTab, setActiveTab] = useState<'scan' | 'typing'>('scan');
  const [studentId, setStudentId] = useState('');
  const { createcheckin } = useCheckin();

  const handleSubmit = async () => {
    if (!/^\d{10}$/.test(studentId)) {
      return addToast({
        title: 'รหัสไม่ถูกต้อง',
        description: 'กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (10 หลัก)',
        color: 'danger',
      });
    }

    if (selectedActivityId.length === 0) {
      return addToast({
        title: 'ยังไม่เลือกกิจกรรม',
        description: 'กรุณาเลือกกิจกรรมก่อนเช็คอิน',
        color: 'warning',
      });
    }

    try {
      await createcheckin({
        user: studentId,
        activities: selectedActivityId,
      });
      
      setStudentId('');
    } catch (err: any) {
      console.error('Checkin error:', err);
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถเช็คอินได้',
        color: 'danger',
      });
    }
  };
  return (
    <>
      <PageHeader description="This is Management Page" icon={<UserRound />} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-center items-center gap-5">
          <Selectdropdown
            selectedActivityId={selectedActivityId}
            setSelectActivityId={setSelectedActivityId}
            activities={activities}
          />
          <div className="flex justify-between gap-5">
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
            onCheckin={async (studentId: string) => {
              try {
                await createcheckin({
                  user: studentId,
                  activities: selectedActivityId,
                });

                addToast({
                  title: 'สแกนสำเร็จ',
                  description: `รหัสนักศึกษา ${studentId} ได้ทำการ check-in`,
                  color: 'success',
                });
              } catch (err: any) {
                console.error('Checkin error:', err);
                addToast({
                  title: 'เกิดข้อผิดพลาด',
                  description:
                    err instanceof Error ? err.message : 'ไม่สามารถเช็คอินได้',
                  color: 'danger',
                });
              }
            }}
          />
        ) : (
          <Input
            onSubmit={handleSubmit}
            studentId={studentId}
            setStudentId={setStudentId}
          />
        )}
      </div>
    </>
  );
}

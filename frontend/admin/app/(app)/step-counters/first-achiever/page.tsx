'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { GraduationCap, CalendarDays, ArrowLeft } from 'lucide-react';
import { Footprints } from 'lucide-react';
import { Button } from '@heroui/button';

const achievers = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  name: 'Wasan Nachai',
  id: '6631503038',
  major: 'SE',
  date: '15/07/2025 09.00 AM',
}));

export default function FirstAchieverPage() {
  const router = useRouter();

  return (
    <div className="p-4">
      <PageHeader
        title="StepConters"
        description="First Goal Achiever"
        icon={<Footprints />}
      />

      <Button
        startContent={<ArrowLeft />}
        variant="flat"
        onPress={() => router.back()}
      >
        Back
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {achievers.map((user) => (
          <div
            key={user.rank}
            className="relative border rounded-xl p-4 bg-white shadow-sm"
          >
            {/* ลำดับ */}
            <div className="absolute top-2 left-2 text-xl font-bold text-gray-300">
              {user.rank}
            </div>

            {/* ชื่อ */}
            <div className="mt-2 font-semibold text-lg">{user.name}</div>
            <p className="text-sm text-gray-500">{user.id}</p>

            {/* วิชา */}
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap size={16} /> {user.major}
            </div>

            {/* วันที่ */}
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={16} /> {user.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

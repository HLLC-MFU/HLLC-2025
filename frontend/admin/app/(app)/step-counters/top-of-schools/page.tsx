'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { Footprints, ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/button';
import StepContersCardList from '../_components/StepCountersCard'; // ✅ import component

const mockData = Array.from({ length: 20 }, (_, i) => ({
  id: '6631503038',
  name: 'Wasan Nachai',
  school: 'ADT',
  schoolFull: 'Applied Digital Technology',
  major: 'SE',
  steps: 15000 - i * 200,
}));

export default function TopOfSchoolsPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <Button
        startContent={<ArrowLeft />}
        variant="flat"
        onPress={() => router.back()}
      >
        Back
      </Button>

      <StepContersCardList data={mockData} variant="topBySchool" />
    </div>
  );
}

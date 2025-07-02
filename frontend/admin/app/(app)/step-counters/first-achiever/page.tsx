'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { Footprints, ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/button';
import StepContersCardList from '../_components/StepCountersCard'; 

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
    <div className="p-4 space-y-6">
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

      <StepContersCardList data={achievers} variant="firstAchiever" />
    </div>
  );
}

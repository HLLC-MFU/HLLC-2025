'use client';

import { useStepCounters } from '@/hooks/useStepCounters';
import StepCountersTable from './_components/StepCountersTable';
import StepCountersModal from './_components/StepCountersModal';
import StepCountersFilter from './_components/StepCountersFilter';
import { Accordion, AccordionItem, Button } from '@heroui/react';
import { Footprints, Globe, Plus, School, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';

export default function StepContersPage() {
  const [isStepTarget, setIsStepTarget] = useState(false);
  const {
    topOverall,
    topBySchool,
    firstAchievers,
    loading,
    error,
  } = useStepCounters();

  const StepcounteTarget = 123;

  return (
    <>
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <Accordion variant="splitted">
        {/* 🌍 Top Overall */}
        <AccordionItem
          key="1"
          aria-label="Accordion 1"
          title="Top Overall"
          subtitle="For the student with the highest step count"
          startContent={<Globe />}
        >
          <StepCountersTable stepCounters={topOverall} />
        </AccordionItem>

        {/* 🏫 Top By School */}
        <AccordionItem
          key="3"
          aria-label="Accordion 2"
          title="Top Schools"
          subtitle="For the student with the highest step count in each school"
          startContent={<School />}
        >
          
          <StepCountersTable stepCounters={topBySchool} />
        </AccordionItem>

        {/* 🎯 First Achievers */}
        <AccordionItem
          key="2"
          aria-label="Accordion 3"
          title="First Achiever"
          subtitle={`For the first student to reach ${StepcounteTarget} steps`}
          startContent={<Target />}
        >
          <div className="flex justify-end items-center mb-2 pr-10">
            <Button
              color="primary"
              endContent={<Plus size={20} />}
              size="lg"
              onPress={() => setIsStepTarget(true)}
            >
              Step Goal
            </Button>
          </div>

          <StepCountersTable stepCounters={firstAchievers} />
        </AccordionItem>
      </Accordion>
      <StepCountersModal
        isOpen={isStepTarget}
        onSettingStepTarget={() => setIsStepTarget(false)}
      />
    </>
  );
}

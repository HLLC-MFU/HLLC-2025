'use client';
import { PageHeader } from '@/components/ui/page-header';
import { Footprints, Plus } from 'lucide-react';
import { useStepCounters } from '@/hooks/useStepCounters';
import { useSchools } from '@/hooks/useSchool';
import { useMajors } from '@/hooks/useMajor';
import { Accordion, AccordionItem, Button } from '@heroui/react';
import { Globe, Target, School } from 'lucide-react';
import StepCountersTable from './_components/StepCountersTable';
import { useState } from 'react';
import StepCountersModal from './_components/StepCountersModal';

export default function StepContersPage() {
  const [isStepTarget, setIsStepTarget] = useState(false);
  const { stepCounters } = useStepCounters();
  const StepcounteTarget = 123;

  return (
    <>
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}

      />
      <Accordion variant="splitted">
        <AccordionItem
          key="1"
          aria-label="Accordion 1"
          title="Top Overall"
          subtitle="For the student with the highest step count"
          startContent={<Globe />}
        >
          <StepCountersTable stepCounters={stepCounters} />
        </AccordionItem>
        <AccordionItem
          key="3"
          aria-label="Accordion 2"
          title="Top Schools"
          subtitle="For the student with the highest step count in each school"
          startContent={<School />}
        >
          <StepCountersTable stepCounters={stepCounters} />
        </AccordionItem>
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

          <StepCountersTable stepCounters={stepCounters} />
        </AccordionItem>
      </Accordion>

      <StepCountersModal
        isOpen={isStepTarget}
        onSettingStepTarget={() => setIsStepTarget(false)}
      />
    </>
  );
}
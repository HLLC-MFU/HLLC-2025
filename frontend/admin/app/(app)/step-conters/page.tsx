'use client';
import { PageHeader } from '@/components/ui/page-header';
import { Footprints, Plus } from 'lucide-react';
import { useStepConters } from '@/hooks/useStepConters';
import { useSchools } from '@/hooks/useSchool';
import { useMajors } from '@/hooks/useMajor';
import { Accordion, AccordionItem, Button } from '@heroui/react';
import { Globe, Target, School } from 'lucide-react';
import StepContersTable from './_components/StepContersTable';
import { useState } from 'react';
import StepContersModal from './_components/StepContersModal';

export default function StepContersPage() {
  const [isStepTarget , setIsStepTarget] = useState(false);
  const { stepCounters } = useStepConters();
  const StepcounteTarget = 123;

  return (
    <>
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
        right={
          <Button
            color="primary"
            endContent={<Plus size={20} />}
            size="lg"
            onPress={() => setIsStepTarget(true)}
          >
            Setting Target
          </Button>
        }
      />
      <Accordion variant="splitted">
        <AccordionItem
          key="1"
          aria-label="Global"
          title="Global"
          subtitle="For the student with the highest step count"
          startContent={<Globe />}
        >
          <StepContersTable stepCounters={stepCounters} />
        </AccordionItem>
        <AccordionItem
          key="2"
          aria-label="Accordion 2"
          title="Target"
          subtitle={`For the first student to reach ${StepcounteTarget} steps`}
          startContent={<Target />}
        >
          <StepContersTable stepCounters={stepCounters} />
        </AccordionItem>
        <AccordionItem
          key="3"
          aria-label="Accordion 3"
          title="School"
          subtitle="For the student with the highest step count in each school"
          startContent={<School />}
        >
          <StepContersTable stepCounters={stepCounters} />
        </AccordionItem>
      </Accordion>

      <StepContersModal
        isOpen={isStepTarget}
        onSettingStepTarget={() => setIsStepTarget(false)}
      />
    </>
  );
}

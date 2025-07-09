'use client';
import { Footprints } from 'lucide-react';

import Scoreboard from './_components/TableScorebord';
import LeaderBoard from './_components/StepContersLeaderboard';

import { PageHeader } from '@/components/ui/page-header';
import { useStepConters } from '@/hooks/useStepConters';
import { useSchools } from '@/hooks/useSchool';
import { useMajors } from '@/hooks/useMajor';

export default function StepContersPage() {
  const { stepCounters } = useStepConters();
  const { schools } = useSchools();
  const { majors } = useMajors();

  return (
    <>
      <PageHeader
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
        title="StepConters"
      />
      <div className="border w-full h-fit rounded-lg ">
        <LeaderBoard StepConterData={stepCounters} />
        <Scoreboard Majors={majors} Schools={schools} StepConterData={stepCounters}/>
      </div>
    </>
  );
}

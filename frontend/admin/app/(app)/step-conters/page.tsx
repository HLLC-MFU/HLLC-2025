'use client';
import { PageHeader } from '@/components/ui/page-header';
import { Footprints } from 'lucide-react';
import Scoreboard from './_components/TableScorebord';
import LeaderBoard from './_components/StepContersLeaderboard';
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
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />
      <div className="border w-full h-fit rounded-lg ">
        <LeaderBoard StepConterData={stepCounters} />
        <Scoreboard StepConterData={stepCounters} Schools={schools} Majors={majors}/>
      </div>
    </>
  );
}

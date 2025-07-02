'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft, Footprints } from 'lucide-react';
import TopThreeCards from '../_components/StepCountersCard';
import StepcontersUserTable from '../_components/StepcountersUserTable';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { useStepConters } from '@/hooks/useStepCounters';

// UI Types
interface RankedUser {
  id: string;
  name: string;
  majorName: string;
  majorAcronym: string;
  schoolName: string;
  schoolAcronym: string;
  steps: number;
  rank: number;
}

interface TableUser {
  id: string;
  name: string;
  major: string;
  school: string;
  steps: number;
  rank: number;
}

export default function TopOverallPage() {
  const router = useRouter();
  const { stepCounters, loading, error } = useStepConters();

  const prepared: Omit<RankedUser, 'rank'>[] = stepCounters.map((item) => {
    const user = item.user;
    const meta = Array.isArray(user.metadata) ? user.metadata[0] : user.metadata;

    const fullName = [user.name?.first, user.name?.middle, user.name?.last]
      .filter(Boolean)
      .join(' ')
      .trim();

    const major = meta?.major;

    const {
      acronym: schoolAcronym = '-',
      name: { en: schoolName = '-' } = {},
    } = typeof major?.school === 'object' &&
       major.school !== null &&
       'acronym' in major.school &&
       'name' in major.school
      ? major.school
      : {};

    return {
      id: user.username,
      name: fullName,
      majorName: major?.name?.en ?? '-',
      majorAcronym: major?.acronym ?? '-',
      schoolName,
      schoolAcronym,
      steps: item.stepCount,
    };
  });

  const ranked: RankedUser[] = prepared
    .sort((a, b) => b.steps - a.steps)
    .map((user, index, array) => {
      const prev = array[index - 1] as RankedUser | undefined;
      const sameAsPrev = prev && user.steps === prev.steps;
      const rank = sameAsPrev ? prev.rank : index + 1;
      return { ...user, rank };
    });

  const topThree = ranked.slice(0, 3);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div>
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />
      <div className="mt-4 space-y-6">
        <Button
          startContent={<ArrowLeft />}
          variant="flat"
          onPress={() => router.back()}
        >
          Back
        </Button>

        {/* Top 3: use acronym */}
        <TopThreeCards
          data={topThree.map((user) => ({
            id: user.id,
            name: user.name,
            major: user.majorAcronym,
            school: user.schoolAcronym,
            steps: user.steps,
            rank: user.rank,
          }))}
          variant="topThree"
        />

        {/* Table: use full name */}
        <StepcontersUserTable
          stepCounters={ranked.map((user): TableUser => ({
            id: user.id,
            name: user.name,
            major: user.majorName,
            school: user.schoolName,
            steps: user.steps,
            rank: user.rank,
          }))}
        />
      </div>
    </div>
  );
}

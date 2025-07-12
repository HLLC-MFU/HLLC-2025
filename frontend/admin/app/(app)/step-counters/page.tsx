'use client';

import { useState, useMemo } from 'react';
import StepCountersTable from './_components/StepCountersTable';
import StepCountersModal from './_components/StepCountersModal';
import { PageHeader } from '@/components/ui/page-header';
import StepCountersSkeleton from './_components/StepCountersSkeleton';
import StepCountersSchoolList from './_components/StepCountersSchoolList';
import { useStepCounters } from '@/hooks/useStepCounters';
import { useStepAchievement } from '@/hooks/useStepAchievement';
import { useSchools } from '@/hooks/useSchool';
import type { StepCounter } from '@/types/step-counters';
import type { Major } from '@/types/major';
import type { School } from '@/types/school';
import { Accordion, AccordionItem, Button, Input } from '@heroui/react';
import { Footprints, Globe, RefreshCw, SchoolIcon, Search, Target } from 'lucide-react';

export default function StepContersPage() {
  const {
    stepByAll,
    loading: stepCounterLoading
  } = useStepCounters();

  const {
    achievement,
    fetchAchievement,
    updateAchievement,
    loading: achievementLoading
  } = useStepAchievement();

  const {
    schools,
    loading: schoolsLoading,
  } = useSchools();

  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isLoading = stepCounterLoading || achievementLoading || schoolsLoading;

  // Search algorithm
  const filterBySearch = (stepData: StepCounter) => {
    const keyword = search.toLowerCase();

    const fullName = `${stepData.user?.name?.first} ${stepData.user?.name?.middle ?? ''} ${stepData.user?.name?.last ?? ''}`
      .toLowerCase().replace('  w', ' ');
    const major = stepData.user?.metadata?.major as Major ?? '';
    const school = major.school as School ?? '';

    return (
      stepData.rank?.toString().toLowerCase().includes(keyword) ||
      stepData.user?.username.includes(keyword) ||
      fullName.includes(keyword) ||
      major.name?.en?.toLowerCase().includes(keyword) ||
      school.name?.en?.toLowerCase().includes(keyword) ||
      stepData.totalStep.toString().toLowerCase().includes(keyword)
    );
  };

  // Highest steps of all
  const topOverall = useMemo(() => {
    return [...stepByAll]
      .filter((sc) => typeof sc.totalStep === 'number' && sc.totalStep !== null)
      .sort((curr, next) => (curr.computedRank ?? Infinity) - (next.computedRank ?? Infinity))
      .slice(0, 3)
  }, [stepByAll]);

  // Highest steps of each school
  const topSchool = useMemo(() => {
    const filteredSchool = schools.map((school) => {
      const studentsInSchool = stepByAll
        .filter((sc) => {
          const userMajor = sc.user.metadata?.major as Major;
          if (!userMajor) return;

          const userSchool = userMajor.school as School;
          if (!userSchool) return;

          if (userSchool._id === school._id) return sc;
        })

      return [...studentsInSchool]
        .sort((curr, next) => (next.totalStep ?? Infinity) - (curr.totalStep ?? Infinity))[0];
    });
    return filteredSchool;
  }, [stepByAll, schools]);

  // People who achieve the goal
  const topAchiever = useMemo(() => {
    return [...stepByAll]
      .filter((sc) => sc.completeStatus && typeof sc.rank === 'number' && filterBySearch(sc))
      .sort((curr, next) => (curr.rank ?? 0) - (next.rank ?? 0))
      .slice(0, 20);
  }, [stepByAll, search]);

  const handleUpdate = async (steps: number) => {
    if (!steps) return;
    const res = await updateAchievement(steps);

    if (res) await fetchAchievement();
  };

  if (isLoading) return (
    <>
      <PageHeader
        title="Step Counters"
        description="Manage steps goal and view leaderBoard"
        icon={<Footprints />}
      />
      <StepCountersSkeleton />
    </>
  );

  return (
    <>
      <PageHeader
        title="Step Counters"
        description="Manage steps goal and view leaderboard"
        icon={<Footprints />}
      />
      <Accordion variant="splitted" selectionMode="multiple" className='p-0'>
        <AccordionItem
          key="1"
          aria-label="Top Overall"
          title="Top Overall"
          subtitle="Top 3 highest steps"
          startContent={
            <div className="p-3 rounded-xl bg-gray-200 border">
              <Globe className="text-gray-500" />
            </div>
          }
        >
          {topOverall.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No step counters data found.</div>
          ) : (
            <StepCountersTable stepCounters={topOverall} />
          )}
        </AccordionItem>

        <AccordionItem
          key="2"
          aria-label="Top Of School"
          title="Top Of School"
          subtitle="Highest steps of each school"
          startContent={
            <div className="p-3 rounded-xl bg-gray-200 border">
              <SchoolIcon className="text-gray-500" />
            </div>
          }
        >
          <StepCountersSchoolList
            schools={schools}
            topSchool={topSchool}
          />
        </AccordionItem>

        <AccordionItem
          key="3"
          aria-label="Top Achievers"
          title="Top Achievers"
          subtitle={`First 20 students to reach ${achievement?.achievement ?? 0} steps`}
          startContent={
            <div className="p-3 rounded-xl bg-gray-200 border">
              <Target className="text-gray-500" />
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="w-full flex justify-between">
              <Input
                isClearable
                value={search}
                onValueChange={setSearch}
                placeholder="Search"
                startContent={<Search className="text-default-400 w-4 h-4" />}
                className="w-full max-w-md"
                size="md"
              />
              <Button
                color="primary"
                endContent={<RefreshCw size={18} />}
                size="md"
                onPress={() => setIsStepModalOpen(true)}
              >
                Update Goal
              </Button>
            </div>
            {topAchiever.length === 0 ? (
              <div className="text-center text-gray-400 py-6">The achievement has not been reached by anyone yet.</div>
            ) : (
              <StepCountersTable stepCounters={topAchiever} isOverall={false} />
            )}
          </div>
        </AccordionItem>
      </Accordion>

      <StepCountersModal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        achievement={achievement}
        onUpdate={handleUpdate}
      />
    </>
  );
}

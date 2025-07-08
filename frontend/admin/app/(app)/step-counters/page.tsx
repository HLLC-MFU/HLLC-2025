'use client';

import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { useStepCounters } from '@/hooks/useStepCounters';
import { useStepAchievement } from '@/hooks/useStepAchiever';
import { useMajors } from '@/hooks/useMajor';
import { useSchools } from '@/hooks/useSchool';
import StepCountersTable from './_components/StepCountersTable';
import StepCountersFilter from './_components/StepCountersFilter';
import StepCountersModal from './_components/StepCountersModal';
import { Accordion, AccordionItem, Button } from '@heroui/react';
import { Footprints, Globe, Plus, SchoolIcon, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import type { StepCounter } from '@/types/step-counters';
import type { Major } from '@/types/major';
import type { School as SchoolType } from '@/types/school';

export default function StepContersPage() {
  const [isStepTarget, setIsStepTarget] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { all, loading, error } = useStepCounters();
  const { majors } = useMajors();
  const { schools } = useSchools();
  const { achievement, updateAchievement } = useStepAchievement();

  const filterBySearch = (item: StepCounter) => {
    const keyword = searchTerm.toLowerCase();
    const id = (item._id ?? '').toLowerCase();
    const username = (item.user?.username ?? '').toLowerCase();
    const fullName = `${item.user?.name?.first ?? ''} ${item.user?.name?.last ?? ''}`.toLowerCase();

    const majorMeta = item.user?.metadata?.major;
    const majorObj = typeof majorMeta === 'string'
      ? majors.find((m) => m._id === majorMeta)
      : (majorMeta as Major | undefined);

    const majorNameEn = majorObj?.name?.en?.toLowerCase() ?? '';

    const schoolObj = typeof majorObj?.school === 'string'
      ? schools.find((s) => s._id === majorObj.school)
      : majorObj?.school as SchoolType;

    const schoolNameEn = schoolObj?.name?.en?.toLowerCase() ?? '';

    return (
      id.includes(keyword) ||
      username.includes(keyword) ||
      fullName.includes(keyword) ||
      majorNameEn.includes(keyword) ||
      schoolNameEn.includes(keyword)
    );
  };

  const todayTop3 = useMemo(() => {
    return [...all]
      .filter((item) => typeof item.totalStep === 'number')
      .sort((a, b) => (b.totalStep ?? 0) - (a.totalStep ?? 0))
      .slice(0, 3)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [all]);

  const topBySchool = useMemo(() => {
    const filtered = schools.map((school, index) => {
      const studentsInSchool = all
        .filter((item) => {
          const majorId =
            typeof item.user?.metadata?.major === 'string'
              ? item.user.metadata.major
              : item.user?.metadata?.major?._id;

          const matchedMajor = majors.find((m) => m._id === majorId);
          if (!matchedMajor || !matchedMajor.school) return false;

          const schoolId =
            typeof matchedMajor.school === 'string'
              ? matchedMajor.school
              : matchedMajor.school._id;

          return schoolId === school._id;
        })
        .filter(filterBySearch);

      const topStudent = [...studentsInSchool]
        .sort((a, b) => (b.totalStep ?? 0) - (a.totalStep ?? 0))[0];

      return {
        ...(topStudent ?? {
          _id: `${school._id}-empty`,
          user: {
            name: { first: '-', middle: '', last: '-' },
            username: '-',
            metadata: {
              major: {
                name: { th: 'Unknown Major', en: 'Unknown Major' },
                school: {
                  name: { th: 'Unknown School', en: 'Unknown School' },
                },
              },
            },
          },
          totalStep: 0,
          rank: index + 1,
        }),
        rank: index + 1,
      };
    });

    return filtered.filter((item) => item.user.username !== '-');
  }, [all, majors, schools, searchTerm]);

  const firstAchievers = useMemo(() => {
    return [...all]
      .filter((item) => item.completeStatus && typeof item.rank === 'number' && filterBySearch(item))
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
      .slice(0, 20);
  }, [all, searchTerm]);

  if (loading) return <div className="p-10 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <PageHeader
        title="Step Counters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <Accordion variant="splitted">
        <AccordionItem
          key="1"
          aria-label="Top Overall"
          title="Top Overall"
          subtitle="3 students with highest step count today"
          startContent={<Globe />}
        >
          {todayTop3.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No data available</div>
          ) : (
            <StepCountersTable stepCounters={todayTop3} />
          )}
        </AccordionItem>

        <AccordionItem
          key="2"
          aria-label="Top By School"
          title="Top Schools"
          subtitle="Highest step count in each school"
          startContent={<SchoolIcon />}
        >
          <div className="w-full px-10 mb-4 flex justify-end">
            <StepCountersFilter value={searchTerm} onChange={setSearchTerm} />
          </div>
          {topBySchool.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No school data available</div>
          ) : (
            <StepCountersTable stepCounters={topBySchool} />
          )}
        </AccordionItem>

        <AccordionItem
          key="3"
          aria-label="First Achiever"
          title="First Achiever"
          subtitle={`First 20 students to reach ${achievement?.achievement ?? 0} steps`}
          startContent={<Target />}
        >
          <div className="w-full px-10 mb-4 flex justify-end gap-3">
            <StepCountersFilter value={searchTerm} onChange={setSearchTerm} />
            <Button
              color="primary"
              endContent={<Plus size={40} />}
              size="md"
              onPress={() => setIsStepTarget(true)}
            >
              Step Goal
            </Button>
          </div>
          {firstAchievers.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No achievers found yet</div>
          ) : (
            <StepCountersTable stepCounters={firstAchievers} />
          )}
        </AccordionItem>
      </Accordion>

      <StepCountersModal
        isOpen={isStepTarget}
        onSettingStepTarget={() => setIsStepTarget(false)}
      />
    </>
  );
}

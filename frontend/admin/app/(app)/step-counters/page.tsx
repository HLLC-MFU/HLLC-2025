'use client';

import { useStepCounters } from '@/hooks/useStepCounters';
import StepCountersTable from './_components/StepCountersTable';
import StepCountersModal from './_components/StepCountersModal';
import StepCountersFilter from './_components/StepCountersFilter';
import { Accordion, AccordionItem, Button } from '@heroui/react';
import { Footprints, Globe, Plus, School, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useMemo, useState } from 'react';

export default function StepContersPage() {
  const [isStepTarget, setIsStepTarget] = useState(false);
  const { topOverall, firstAchievers, loading, error } = useStepCounters();

  const StepcounteTarget = 123;
  const [searchTopBySchool, setSearchTopBySchool] = useState('');
  const [searchFirstAchiever, setSearchFirstAchiever] = useState('');

  // คำนวณอันดับ 1 ของแต่ละโรงเรียนจาก topOverall
  const topBySchool = useMemo(() => {
    const topStudentsBySchool = new Map<string, typeof topOverall[number]>();

    topOverall.forEach((item) => {
      const current = topStudentsBySchool.get(item.school);
      if (!current || item.stepsCounts > current.stepsCounts) {
        topStudentsBySchool.set(item.school, item);
      }
    });

    return Array.from(topStudentsBySchool.values());
  }, [topOverall]);

  const filteredTopBySchool = topBySchool.filter((item) =>
    (item.name ?? '').toLowerCase().includes(searchTopBySchool.toLowerCase()) ||
    (item.major ?? '').toLowerCase().includes(searchTopBySchool.toLowerCase()) ||
    (item.school ?? '').toLowerCase().includes(searchTopBySchool.toLowerCase())
  );

  const filteredFirstAchievers = firstAchievers.filter((item) =>
    (item.name ?? '').toLowerCase().includes(searchFirstAchiever.toLowerCase()) ||
    (item.major ?? '').toLowerCase().includes(searchFirstAchiever.toLowerCase()) ||
    (item.school ?? '').toLowerCase().includes(searchFirstAchiever.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <Accordion variant="splitted">
        {/* Top Overall */}
        <AccordionItem
          key="1"
          aria-label="Accordion 1"
          title="Top Overall"
          subtitle="For the student with the highest step count"
          startContent={<Globe />}
        >
          {topOverall.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No data available</div>
          ) : (
            <StepCountersTable stepCounters={topOverall} />
          )}
        </AccordionItem>

        {/*  Top By School */}
        <AccordionItem
          key="3"
          aria-label="Accordion 2"
          title="Top Schools"
          subtitle="For the student with the highest step count in each school"
          startContent={<School />}
        >
          <div className="px-10">
            <StepCountersFilter
              value={searchTopBySchool}
              onChange={setSearchTopBySchool}
            />
          </div>
          {filteredTopBySchool.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No school data available</div>
          ) : (
            <StepCountersTable stepCounters={filteredTopBySchool} />
          )}
        </AccordionItem>

        {/*  First Achiever */}
        <AccordionItem
          key="2"
          aria-label="Accordion 3"
          title="First Achiever"
          subtitle={`For the first student to reach ${StepcounteTarget} steps`}
          startContent={<Target />}
        >
          <div className="w-full px-10">
            <div className="flex justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[200px]">
                <StepCountersFilter
                  value={searchFirstAchiever}
                  onChange={setSearchFirstAchiever}
                />
              </div>
              <Button
                color="primary"
                endContent={<Plus size={20} />}
                size="md"
                onPress={() => setIsStepTarget(true)}
              >
                Step Goal
              </Button>
            </div>
          </div>
          {filteredFirstAchievers.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No achievers found yet</div>
          ) : (
            <StepCountersTable stepCounters={filteredFirstAchievers} />
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

'use client';

import type { UseruseSystem } from '@/types/user-stats';

import { useState, useEffect } from 'react';
import { Button, Accordion, AccordionItem } from '@heroui/react';
import { LayoutDashboard, Users, FileText, Activity } from 'lucide-react';

import { ReportCharts } from './_components/DashboardReportCharts';
import Overview from './_components/DashboardOverview';
import FresherCheckinDashboard from './_components/FresherCheckinDashboard';
import ListPretest from './_components/ListPretest';
import ListPosttest from './_components/ListPosttest';
import AssessmentTable from './_components/AssessmentTable';

import { useCheckin } from '@/hooks/useCheckin';
import { useSponsors } from '@/hooks/useSponsors';
import { PageHeader } from '@/components/ui/page-header';
import { useEvoucher } from '@/hooks/useEvoucher';
import { useReports } from '@/hooks/useReports';
import { useReportTypes } from '@/hooks/useReportTypes';
import { useUserStatistics } from '@/hooks/useUsersytem';
import { useActivities } from '@/hooks/useActivities';
import { usePretest } from '@/hooks/usePretestAnswer';
import { usePosttest } from '@/hooks/usePosttestAnswer';
import { useAssessmentAverages } from '@/hooks/useAssessmentAnswer';


export default function Dashboard() {
  const { activities } = useActivities({ autoFetch: true });
  const { fetchCheckinByActivity } = useCheckin(null);
  const { pretestAverage, pretestAnswer } = usePretest();
  const { posttestAverage, posttestAnswer, totalAverageCount } = usePosttest();
  const [allCheckins, setAllCheckins] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const combinedCheckins = Object.values(allCheckins).flat();
  const { sponsors } = useSponsors();
  const { evouchers } = useEvoucher();
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const { Userstats } = useUserStatistics();
  const [selectedActivityId, setSelectedActivityId] = useState<
    string | undefined
  >(undefined);
  const { data, error, refetch } = useAssessmentAverages(selectedActivityId);

  useEffect(() => {
    async function fetchAllCheckins() {
      if (activities.length === 0) return;
      setLoading(true);
      const result: Record<string, any[]> = {};

      for (const activity of activities) {
        const checkins = await fetchCheckinByActivity(activity._id);

        result[activity._id] = checkins || [];
      }

      setAllCheckins(result);
      setLoading(false);
    }

    fetchAllCheckins();
  }, [activities]);

  const countsByType = activities.reduce((acc, activity) => {
    const { type, name } = activity;

    if (!acc[type as string]) {
      acc[type as string] = new Set();
    }
    acc[type as string].add(name.en);

    return acc;
  }, {} as Record<string, Set<string>>);
  const activityStats = Object.entries(countsByType).map(([type, names]) => ({
    type,
    count: names.size,
  }));

  const defaultExpandedKeys = [
    'overview',
    'checkin',
    'pretest',
    'posttest',
    'reports',
  ];

  return (
    <>
      <PageHeader
        description="System overview — quickly access key modules, recent activity, and system statistics."
        icon={<LayoutDashboard />}
      />

      <div className="h-fit w-full flex flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Button color="primary" size="lg" variant="shadow">
          Export XLS
        </Button>
      </div>

      <div>
        <Overview
          Activities={activityStats}
          Evouchers={evouchers}
          Sponsors={sponsors}
          Userstats={Userstats ?? ({} as UseruseSystem)}
          checkin={combinedCheckins}
          isLoading={loading}
        />
      </div>

      <Accordion
        className="px-0"
        defaultExpandedKeys={defaultExpandedKeys}
        selectionMode="multiple"
        variant="splitted"
      >
        <AccordionItem
          key="checkin"
          aria-label="Checked In Fresher"
          className="mb-4"
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-xl font-semibold">Checked In Fresher</span>
            </div>
          }
        >
          <div className="p-4">
            <div className="w-full h-96 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-muted flex items-center justify-center">
              <FresherCheckinDashboard checkIn={combinedCheckins} />
            </div>
          </div>
        </AccordionItem>

        <AccordionItem
          key="pretest"
          aria-label="Pretest Dashboard"
          className="mb-4"
          title={
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-xl font-semibold">Pretest</span>
            </div>
          }
        >
          <div className="p-4">
            <ListPretest
              pretestAnswers={pretestAnswer}
              pretestAverage={pretestAverage}
            />
          </div>
        </AccordionItem>

        <AccordionItem
          key="posttest"
          aria-label="Posttest Dashboard"
          className="mb-4"
          title={
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-xl font-semibold">Posttest</span>
            </div>
          }
        >
          <div className="p-4">
            <ListPosttest
              posttestAnswers={posttestAnswer}
              posttestAverage={posttestAverage}
              totalAverageCount={totalAverageCount}
            />
          </div>
        </AccordionItem>
        <AccordionItem
          key="assessment-answers"
          aria-label="Assessment Answer Dashboard"
          className="mb-4"
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-xl font-semibold">Assessment Answers</span>
            </div>
          }
        >
          <div className="p-4">
            <AssessmentTable />
          </div>
        </AccordionItem>

        <AccordionItem
          key="reports"
          aria-label="Reports Dashboard"
          className="mb-4"
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-xl font-semibold">Reports</span>
            </div>
          }
        >
          <div className="p-4">
            <ReportCharts problems={problems} reporttypes={reporttypes} />
          </div>
        </AccordionItem>
      </Accordion>
    </>
  );
}

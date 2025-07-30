'use client';

import type { UseruseSystem } from '@/types/user-stats';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { LayoutDashboard, Users, FileText, AlertTriangle } from 'lucide-react';

import { ReportCharts } from './_components/DashboardReportCharts';
import Overview from './_components/DashboardOverview';
import FresherCheckinDashboard from './_components/FresherCheckinDashboard';
import AssessmentTable from './_components/AssessmentTable';
import CardStat from './_components/CardStat';

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
import ActivityTable from './_components/ActivityTable';
import PretestDetail from './_components/PretestDetail';


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
  const { reports } = useReports();
  const { reporttypes } = useReportTypes();
  const { Userstats } = useUserStatistics();
  // const [selectedActivityId, setSelectedActivityId] = useState<
  //   string | undefined
  // >(undefined);
  // const { data, error, refetch } = useAssessmentAverages(selectedActivityId);

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
  const activityStats = Object.entries(countsByType).filter(([type]) => !!type).map(([type, names]) => ({
    type,
    count: names.size,
  }));



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
      <div className='space-y-6'>
        <CardStat colors='lime-100' icon={<Users className="w-4 h-4" />} label="Fresher Checkin">
          <div className="flex flex-col gap-2 text-center w-full">
            <FresherCheckinDashboard checkIn={combinedCheckins} />
          </div>
        </CardStat>

        <CardStat colors='blue-100' icon={<FileText className="w-4 h-4" />} label="Activities Overview">
          <div className="flex flex-col gap-2 text-center w-full">
            <ActivityTable />
          </div>
        </CardStat>

        <div className='grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6'>
          <div className='col-span-2'>
            <CardStat colors='purple-100' icon={<FileText className="w-4 h-4" />} label="Pretest">
              <PretestDetail />
            </CardStat>
          </div>

          {/* <div className='sm:col-span-2 md:col-span-1 lg:col-span-1'>
            <CardStat colors='purple-100' icon={<FileText className="w-4 h-4" />} label="Posttest Dashboard">
              <div className="flex flex-col gap-2 text-center w-full">
                <ListPosttest
                  posttestAnswers={posttestAnswer}
                  posttestAverage={posttestAverage}
                  totalAverageCount={totalAverageCount}
                />
              </div>
            </CardStat>
          </div> */}
        </div>

        <CardStat colors='slate-100' icon={<FileText className="w-4 h-4" />} label="Activities Overview">
          <div className="flex flex-col gap-2 text-center w-full">
            <AssessmentTable />
          </div>
        </CardStat>

        <CardStat colors='red-100' icon={<AlertTriangle className="w-4 h-4" />} label="Reports Overview">
          <div className="flex flex-col gap-2 text-center w-full">
            <ReportCharts reports={reports} reporttypes={reporttypes} />
          </div>
        </CardStat>
      </div>
    </>
  );
}

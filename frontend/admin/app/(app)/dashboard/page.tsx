'use client';
import { Button } from "@heroui/react";
import { LayoutDashboard } from 'lucide-react';

import { ReportCharts } from "./_components/DashboardReportCharts";
import Overview from "./_components/DashboardOverview";
import Charts from "./_components/DashboardTimeLineCharts";

import { useCheckin } from "@/hooks/useCheckin";
import { useSponsors } from "@/hooks/useSponsors";
import { PageHeader } from "@/components/ui/page-header";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { useUserStatistics } from "@/hooks/useUsersytem";
import { useActivities } from "@/hooks/useActivities";
import { UseruseSystem } from "@/types/user-stats"


export default function Dashboard() {

  const { checkin, loading } = useCheckin();
  const { activities } = useActivities();
  const { sponsors } = useSponsors();
  const { evouchers } = useEvoucher();
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const { Userstats } = useUserStatistics();  

  return (
    <>
      <PageHeader description='System overview — quickly access key modules, recent activity, and system statistics.' icon={<LayoutDashboard />} />
      <div className=" h-fit w-full flex flex-row justify-between items-center">
        <h1 className=" text-3xl font-semibold "> Overview </h1>
        <Button color="primary" size="lg" variant="shadow">
          Export XLS
        </Button>
      </div>
      <Overview
        Activities={activities}
        Evouchers={evouchers}
        Sponsors={sponsors}
        Userstats={Userstats ?? {} as UseruseSystem}
        checkin={checkin}
        isLoading={loading}
      />

      <h1 className=" text-2xl font-semibold my-6"> TimeLine </h1>
      <div className="w-full h-96 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-muted flex items-center justify-center">
        <Charts />
      </div>
      <h1 className=" text-2xl font-semibold my-6">Reports</h1>
      <ReportCharts problems={problems} reporttypes={reporttypes} />
    </>
  );
}
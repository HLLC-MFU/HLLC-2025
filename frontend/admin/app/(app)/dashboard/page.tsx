'use client';
import { Button } from "@heroui/react";
import { LayoutDashboard } from 'lucide-react';
import { useCheckin } from "@/hooks/useCheckin";
import { useUsers } from "@/hooks/useUsers";
import { useSponsors } from "@/hooks/useSponsors";
import { PageHeader } from "@/components/ui/page-header";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useActivities } from "@/hooks/useActivities";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { ReportCharts } from "./_components/ReportCharts";
import Overview from "./_components/Overview";
import Charts from "./_components/TimeLineCharts";


export default function Dashboard() {

  const { checkin, loading } = useCheckin();
  const { users } = useUsers();
  const { activities } = useActivities();
  const { sponsors } = useSponsors();
  const { evouchers } = useEvoucher();
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();

  return (
    <>
      <PageHeader description='System overview — quickly access key modules, recent activity, and system statistics.' icon={<LayoutDashboard />} />
      <div className=" h-fit w-full flex flex-row justify-between items-center">
        <h1 className=" text-3xl font-semibold "> Overview </h1>
        <Button color="primary" variant="shadow" size="lg">
          Export XLS
        </Button>
      </div>
      <Overview
        checkin={checkin}
        Users={users}
        Activities={activities}
        Evouchers={evouchers}
        Sponsors={sponsors}
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
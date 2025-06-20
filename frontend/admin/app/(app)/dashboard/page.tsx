'use client';
import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import { Users, Ticket, ScanLine, Star, LayoutDashboard, FileQuestion, Activity } from 'lucide-react';
import { Button } from "@heroui/react";
import { useCheckin } from "@/hooks/useCheckin";
import { useSponsors } from "@/hooks/useSponsors";
import { PageHeader } from "@/components/ui/page-header";
import { Accordion, AccordionItem } from "@heroui/react";
import { usePrepostQuestions } from "@/hooks/usePrepostQuestions";
import { useAssessment } from "@/hooks/useAssessment";
import AssessmentOverviewDashboard from "./_components/DashboardOverviewQuestion";
import ActivityDashboard from "./_components/DashboardActivity";

const icons = [
  <ScanLine className="h-6 w-6 text-lime-600" />,
  <Users className="h-6 w-6 text-amber-400" />,
  <Ticket className="h-6 w-6 text-cyan-400" />,
  <Star className="h-6 w-6 text-emerald-400" />,
];
import { useEvoucher } from "@/hooks/useEvoucher";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { ReportCharts } from "./_components/DashboardReportCharts";
import Overview from "./_components/DashboardOverview";
import Charts from "./_components/DashboardTimeLineCharts";
import { useUserStatistics } from "@/hooks/useUsersytem";
import { useActivities } from "@/hooks/useActivities";
import { UseruseSystem } from "@/types/user-stats"


export default function Dashboard() {

  const { checkin, loading } = useCheckin();
  const { activities } = useActivities();
  const { sponsors } = useSponsors();
  
  const { activityProgress, loading: activityLoading } = useAssessment();
  const { evouchers } = useEvoucher();
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const { Userstats } = useUserStatistics();  

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
        Userstats={Userstats ?? {} as UseruseSystem}
        Activities={activities}
        Evouchers={evouchers}
        Sponsors={sponsors}
        isLoading={loading}
      />

      <h1 className=" text-2xl font-semibold my-6"> TimeLine </h1>
      <div className="w-full h-96 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-muted flex items-center justify-center">
        <Charts />
      </div>

      {/* Assessment Results Accordion */}
      <div className="mt-6">
        <Accordion variant="splitted" className="px-0">
          {/* Pretest Results */}
          <AccordionItem
            key="pretest"
            aria-label="Pretest Results"
            startContent={<FileQuestion className="h-5 w-5 text-primary" />}
            title="Pretest Results"
            className="font-medium mb-2"
          >
            <AssessmentOverviewDashboard 
              type="pretest" 
              loading={false}
            />
          </AccordionItem> 

          {/* Posttest Results */}
          <AccordionItem
            key="posttest"
            aria-label="Posttest Results"
            startContent={<FileQuestion className="h-5 w-5 text-primary" />}
            title="Posttest Results"
            className="font-medium mb-2"
          >
            <AssessmentOverviewDashboard 
              type="posttest" 
              loading={false}
            />
          </AccordionItem> 

          {/* Activity Dashboard */}
          <AccordionItem
            key="activity"
            aria-label="Activity Dashboard"
            startContent={<Activity className="h-5 w-5 text-primary" />}
            title="Activity Dashboard"
            className="font-medium mb-2"
          >
            <ActivityDashboard /> 
          </AccordionItem> 
        </Accordion>  
      </div> 
      <h1 className=" text-2xl font-semibold my-6">Reports</h1>
      <ReportCharts problems={problems} reporttypes={reporttypes} />
    </>
  );
}
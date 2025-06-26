'use client';
import {  LayoutDashboard, FileQuestion, Activity, BookOpenText, UserCog } from 'lucide-react';
import { Button } from "@heroui/react";
import { useCheckin } from "@/hooks/useCheckin";
import { PageHeader } from "@/components/ui/page-header";
import { Accordion, AccordionItem } from "@heroui/react";
import AssessmentOverviewDashboard from "../assessments/_components/question-overview-dashboard";
import ActivityDashboard from "../assessments/_components/activity-dashboard";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { ReportCharts } from "./_components/DashboardReportCharts";
import Overview from "./_components/DashboardOverview";
import { useUserStatistics } from "@/hooks/useUserSytem";
import { UseruseSystem } from "@/types/user-stats"


export default function Dashboard() {

  const { checkin, loading } = useCheckin();
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const { userstats } = useUserStatistics(); 
  
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
        Userstats={userstats ?? {} as UseruseSystem}
        isLoading={loading}
      />

      <h1 className=" text-2xl font-semibold my-6">Check in</h1>
      <Accordion variant="splitted" className="px-0" defaultExpandedKeys={['student']}>
        <AccordionItem
          key="student"
          aria-label="Student Checkin"
          startContent={<BookOpenText className='h-5 w-5 text-primary' />}
          title="Student Checkin"
          className='font-medium mb-2'
        >
         {/* <CheckinOverviewDashboard
         
         /> */}
        </AccordionItem>
        <AccordionItem
          key="staff"
          aria-label="Staff Checkin"
          startContent={<UserCog className='h-5 w-5 text-primary' />}
          title="Staff Checkin"
          className='font-medium mb-2'
        >
        
        </AccordionItem>
      </Accordion>

      <h1 className=" text-2xl font-semibold my-6">Assessments</h1>
      <div className="mt-6">
        <Accordion variant="splitted" className="px-0" defaultExpandedKeys={['pretest']}>
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
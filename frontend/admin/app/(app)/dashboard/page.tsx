'use client';
import { LayoutDashboard, FileQuestion, Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Accordion, AccordionItem } from '@heroui/react';
import AssessmentOverviewDashboard from '../assessments/_components/question-overview-dashboard';
import ActivityDashboard from '../assessments/_components/activity-dashboard';
import ReportCharts  from './_components/DashboardReportChart';
import Overview from './_components/DashboardOverview';
import CheckinBarChart from './_components/DashboardCheckinBarChart';
import StudentChart from './_components/DashbaordStudentChart';

export default function DashboarPage() {

  return (
    <>
      <PageHeader
        description="System overview — quickly access key modules, recent activity, and system statistics."
        icon={<LayoutDashboard />}
      />
      <Overview/>
      <div className=" flex flex-col lg:flex-row  justify-between gap-7">
        <StudentChart />
        <CheckinBarChart />
      </div>

      <h1 className=" text-2xl font-semibold my-6">Assessments</h1>
      <div className="mt-6">
        <Accordion
          variant="splitted"
          className="px-0"
          defaultExpandedKeys={['pretest']}
        >
          <AccordionItem
            key="pretest"
            aria-label="Pretest Results"
            startContent={<FileQuestion className="h-5 w-5 text-primary" />}
            title="Pretest Results"
            className="font-medium mb-2"
          >
            <AssessmentOverviewDashboard type="pretest" loading={false} />
          </AccordionItem>

          <AccordionItem
            key="posttest"
            aria-label="Posttest Results"
            startContent={<FileQuestion className="h-5 w-5 text-primary" />}
            title="Posttest Results"
            className="font-medium mb-2"
          >
            <AssessmentOverviewDashboard type="posttest" loading={false} />
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
      <ReportCharts/>
    </>
  );
}

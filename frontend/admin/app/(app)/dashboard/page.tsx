'use client';
import {
  LayoutDashboard,
  FileQuestion,
  Activity,
  Download,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
} from '@heroui/react';
import { useCheckin } from '@/hooks/useCheckin';
import { PageHeader } from '@/components/ui/page-header';
import { Accordion, AccordionItem } from '@heroui/react';
import AssessmentOverviewDashboard from '../assessments/_components/question-overview-dashboard';
import ActivityDashboard from '../assessments/_components/activity-dashboard';
import { useReports } from '@/hooks/useReports';
import { useReportTypes } from '@/hooks/useReportTypes';
import { ReportCharts } from './_components/DashboardReportCharts';
import Overview from './_components/DashboardOverview';
import { useUserStatistics } from '@/hooks/useUserSytem';
import { useEvoucher } from '@/hooks/useEvoucher';
import { useActivities } from '@/hooks/useActivities';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import { User } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type } from 'os';
import { useCallback } from 'react';

const CheckinActivitytDataMock = [
  { activity: 'Yoga Class', value: 200 },
  { activity: 'Team Meeting', value: 240 },
  { activity: 'Design ', value: 180 },
  { activity: 'Coding Bootcamp', value: 250 },
  { activity: 'Weekly Recap', value: 190 },
  { activity: 'Volunteer Activity', value: 155 },
  { activity: 'Open Day Event', value: 200 },
];

export default function Dashboard() {
  const { checkin, loading } = useCheckin();
  const { problems } = useReports();
  const { evouchers } = useEvoucher();
  const { reporttypes } = useReportTypes();
  const { userstats } = useUserStatistics();
  const { activities } = useActivities();
  const { lamduanFlowers } = useLamduanFlowers();

  const StudentStats = userstats?.student;

  const StudentStatsChartsData = [
    { name: 'Total', value: StudentStats?.total, color: '#DCDCDC' },
    { name: 'Register', value: StudentStats?.registered, color: '#708CFF' },
    {
      name: 'Not Register',
      value: StudentStats?.notRegistered,
      color: '#8DD8FF',
    },
  ];

  const UserNotCheckIn = (StudentStats?.registered ?? 0) - checkin.length;

  const downloadCSV = useCallback(() => {
    if (!checkin?.length) return;

    const dataToExport = checkin.map((checkin) => ({
      'Student ID': checkin.user?.username || '',
      Name: [
        checkin.user?.name?.first || '',
        checkin.user?.name?.middle || '',
        checkin.user?.name?.last || '',
      ]
        .filter(Boolean)
        .join(' '),
      School: checkin.user?.metadata?.[0]?.major?.school || '',
      Major: checkin.user?.metadata?.[0]?.major || '',
      Activity: checkin.activity?.name?.en || '',
    }));

    const headers = Object.keys(dataToExport[0]);

    const escapeValue = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`; // escape เครื่องหมายคำพูด

    const csvContent = [
      headers.map(escapeValue).join(','),
      ...dataToExport.map((row) =>
        headers
          .map((header) =>
            escapeValue((row as Record<string, any>)[header] || ''),
          )
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_student_details.csv`;
    link.click();
    URL.revokeObjectURL(url); // cleanup
  }, [checkin, type]);

  return (
    <>
      <PageHeader
        description="System overview — quickly access key modules, recent activity, and system statistics."
        icon={<LayoutDashboard />}
      />
      <Overview
        activities={activities}
        evouchers={evouchers}
        lamduanFlowers={lamduanFlowers}
        reports={problems}
        isLoading={loading}
      />

      <div className=" flex flex-row justify-between gap-7">
        <Card className="min-w-[324px]">
          <CardHeader>
            <h1 className=" text-2xl font-semibold"> Student </h1>
          </CardHeader>
          <CardBody className="">
            <PieChart width={300} height={200}>
              <Pie
                data={StudentStatsChartsData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                startAngle={25}
                endAngle={385}
              >
                {StudentStatsChartsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </CardBody>
          <CardFooter>
            <div className=" space-y-3 text-sm w-full px-4 mb-3 ">
              {StudentStatsChartsData.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-md"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className=" text-sm font-medium">{item.name}</span>
                  </div>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>
        <Card className=" w-full">
          <CardHeader>
            <div className=" flex w-full justify-between px-3">
              <h1 className=" text-2xl font-semibold"> Check In</h1>
              <Button
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={downloadCSV}
                variant="flat"
                isDisabled={checkin.length === 0}
                size="sm"
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={CheckinActivitytDataMock} margin={{ right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" />
                <Tooltip />
                <YAxis />
                <Bar dataKey="value" fill="#8884d8" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
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
      <ReportCharts problems={problems} reporttypes={reporttypes} />
    </>
  );
}

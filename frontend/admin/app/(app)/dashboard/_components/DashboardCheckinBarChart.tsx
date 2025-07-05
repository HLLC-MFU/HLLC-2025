import { useCheckin } from '@/hooks/useCheckin';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Pagination,
} from '@heroui/react';
import { Car, Download, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  Tooltip,
  YAxis,
  Bar,
  BarChart,
  Legend,
  LabelList,
} from 'recharts';

export default function CheckinBarChart() {
  const { checkin, checkinStats } = useCheckin();
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { activity, internCheckin, studentCheckin, notCheckin } =
        payload[0].payload;
      return (
        <Card>
          <CardBody className="space-y-1">
            <p className="font-bold"> {activity} </p>
            <p className="text-primary">
              Freshers Checked In : {studentCheckin}{' '}
            </p>
            <p className="text-danger">
              Freshers Not Checked In: {notCheckin}
            </p>
          </CardBody>
          <Divider />
          <CardFooter>
            <p className="text-warning">Intern Acttendance: {internCheckin}</p>
          </CardFooter>
        </Card>
      );
    }
  };

  const studentCheckinChartsData = checkinStats.map((item) => ({
    activity: item.name.en,
    acronym: item.acronym,
    internCheckin: item.internCheckin,
    studentCheckin: item.studentCheckin,
    notCheckin: item.notCheckin,
  }));

  const downloadCSV = () => {
    const activityNames = Array.from(
      new Set(checkin.map((c) => c.activity?.name?.en || 'Unknown')),
    );

    // สมมติ user ใช้ username เป็น key
    const userActivityMap: Record<string, Set<string>> = {};

    checkin.forEach((c) => {
      const username = c.user?.username || '';
      const activityName = c.activity?.name?.en || 'Unknown';
      if (!userActivityMap[username]) {
        userActivityMap[username] = new Set();
      }
      userActivityMap[username].add(activityName);
    });

    // แปลง checkin เป็น unique user list
    const uniqueUsers = Array.from(
      new Set(checkin.map((c) => c.user?.username || '')),
    );

    const dataToExport = uniqueUsers.map((username) => {
      // หา metadata จาก user แรกที่เจอ username นี้
      const userCheckins = checkin.filter((c) => c.user?.username === username);
      const firstUser = userCheckins[0]?.user;
      const metadata = Array.isArray(firstUser?.metadata)
        ? firstUser.metadata[0]
        : firstUser?.metadata;

      // สร้าง object
      const baseData: Record<string, string> = {
        'Student ID': username,
        Name: [
          firstUser?.name?.first || '',
          firstUser?.name?.middle || '',
          firstUser?.name?.last || '',
        ]
          .filter(Boolean)
          .join(' '),
        Major: metadata?.major?.name?.en || '',
        School: metadata?.major?.school?.name?.en || '',
      };

      // เพิ่ม column กิจกรรมเป็น ✓ หรือ ว่าง
      activityNames.forEach((actName) => {
        baseData[actName] = userActivityMap[username]?.has(actName) ? '1' : '0';
      });

      return baseData;
    });

    const headers = Object.keys(dataToExport[0]);

    const escapeValue = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`; // escape double quotes

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
    link.download = `checkin_student_details.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const paginatedData = studentCheckinChartsData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <div className="col-span-3">
      <Card>
        <CardHeader>
          <div className=" flex w-full justify-between pl-3">
            <div className=" flex items-center justify-center space-x-2">
              <UserRoundCheck className=" w-5 h-5 text-primary" />
              <h3 className=" text-lg font-semibold"> CheckIn</h3>
            </div>
            <Button
              color="primary"
              startContent={<Download className="w-4 h-4" />}
              onPress={downloadCSV}
              isDisabled={studentCheckinChartsData.length === 0}
              variant="flat"
              size="sm"
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paginatedData} margin={{ right: 50, top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="acronym"
                stroke="#6B7280"
                tick={{ fontSize: 14, fontWeight: 600 }}
              />
              <Tooltip content={customTooltip} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
              <Bar
                dataKey="studentCheckin"
                name="Freshers"
                fill="#486CFF"
                barSize={30}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="studentCheckin"
                  position="top"
                  style={{ fontSize: 14, fontWeight: 600 }}
                />
              </Bar>
              <Bar
                dataKey="internCheckin"
                name="Intern"
                fill="#F5A524"
                barSize={30}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="internCheckin"
                  position="top"
                  formatter={(value: number) => (value === 0 ? '' : value)}
                  style={{ fontSize: 14, fontWeight: 600 }}
                />
              </Bar>
              <Legend
                wrapperStyle={{
                  marginTop: 20,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
        <CardFooter className=" flex justify-center items-center ">
          <Pagination
            loop
            showControls
            showShadow
            siblings={2}
            initialPage={page}
            size="md"
            total={Math.ceil(studentCheckinChartsData.length / rowsPerPage)}
            onChange={(newPage) => setPage(newPage)}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

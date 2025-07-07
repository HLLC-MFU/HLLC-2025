import { useActivities } from '@/hooks/useActivities';
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
import * as XLSX from 'xlsx';

export default function CheckinBarChart() {
  const { checkin, checkinStats } = useCheckin();
  const { activities } = useActivities()
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
            <p className="text-danger">Freshers Not Checked In: {notCheckin}</p>
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
    // 1. ดึงชื่อกิจกรรมทั้งหมดจากข้อมูล activity
    const activityNames = Array.from(
      new Set(activities.map((c) => c.name.en || 'Unknown Activity')),
    );

    // สร้าง Map เพื่อเก็บว่า User คนไหน Check-in กิจกรรมอะไรบ้าง
    const userActivityMap: Record<string, Set<string>> = {};
    checkin.forEach((c) => {
      const username = c.user?.username || '';
      const activityName = c.activity.name.en || 'Unknown Activity';
      if (username) {
        // ตรวจสอบให้แน่ใจว่า username ไม่ว่าง
        if (!userActivityMap[username]) {
          userActivityMap[username] = new Set();
        }
        userActivityMap[username].add(activityName);
      }
    });

    // เตรียมข้อมูลสำหรับ Student และ Intern แยกกัน
    const studentsData: any[] = [];
    const internsData: any[] = [];

    // สร้าง Set ของ username ที่ไม่ซ้ำกัน เพื่อประมวลผลแต่ละ user เพียงครั้งเดียว
    const uniqueUsernames = Array.from(
      new Set(checkin.map((c) => c.user?.username || '')),
    ).filter(Boolean); 

    uniqueUsernames.forEach((username) => {
      // หาข้อมูล user จาก checkin แรกที่เจอ username นี้
      const userCheckins = checkin.filter((c) => c.user?.username === username);
      const firstUser = userCheckins[0]?.user;

      // ข้ามไปถ้าไม่มีข้อมูล user หรือ username ว่าง
      if (!firstUser || !username) {
        return;
      }

      // ดึง metadata (major, school)
      const metadata = Array.isArray(firstUser.metadata)
        ? firstUser.metadata[0]
        : firstUser.metadata;

      // สร้างข้อมูลพื้นฐานของ user
      const baseData: Record<string, string> = {
        'Student ID': username,
        Name: [
          firstUser.name?.first || '',
          firstUser.name?.middle || '',
          firstUser.name?.last || '',
        ]
          .filter(Boolean)
          .join(' '),
        Major: metadata?.major?.name?.en || '',
        School: metadata?.major?.school?.name?.en || '',
      };

      // เพิ่มคอลัมน์กิจกรรมเป็น '1' (มี check-in) หรือ '0' (ไม่มี check-in)
      activityNames.forEach((actName) => {
        baseData[actName] = userActivityMap[username]?.has(actName) ? '1' : '0';
      });

      // ตรวจสอบ role และเพิ่มข้อมูลลงใน array ที่ถูกต้อง
      const userRole = firstUser.role?.name?.toLowerCase();

      if (userRole === 'student') {
        studentsData.push(baseData);
      } else if (userRole === 'intern') {
        internsData.push(baseData);
      }
    });

    // สร้าง Workbook ใหม่
    const wb = XLSX.utils.book_new();

    // ฟังก์ชันช่วยเพิ่ม Sheet
    const addSheet = (data: any[], sheetName: string) => {
      if (data.length > 0) {
        // ตรวจสอบว่ามีข้อมูลจริง ๆ ก่อนสร้าง sheet
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    };

    // เพิ่ม Sheet สำหรับ Student และ Intern เท่านั้น
    addSheet(studentsData, 'Students');
    addSheet(internsData, 'Interns');

    // ตรวจสอบว่ามี sheet อย่างน้อย 1 sheet ก่อนจะบันทึก
    if (wb.SheetNames.length === 0) {
      alert('No data available for Students or Interns to export.');
      return;
    }

    // เขียนไฟล์ Excel และดาวน์โหลด
    XLSX.writeFile(wb, `checkin_student_intern_details.xlsx`);
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
        <CardFooter className=" flex justify-center items-center pb-5 px-6 ">
          <Pagination
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

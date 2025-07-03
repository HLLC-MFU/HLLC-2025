import { useUserStatistics } from '@/hooks/useUserSytem';
import { Card, CardBody, CardFooter, CardHeader, Tooltip } from '@heroui/react';
import { Users  } from 'lucide-react';
import { Pie, Cell, PieChart } from 'recharts';

export default function StudentChart() {
  const { userstats } = useUserStatistics();
  const studentStats = userstats?.student;
  const studentStatsChartsData = [
    { name: 'Total', value: studentStats?.total, color: '#DCDCDC' },
    { name: 'Register', value: studentStats?.registered, color: '#486CFF' },
    { name: 'Not Register',  value: studentStats?.notRegistered, color: '#8DD8FF'}
  ];

  return (
    <Card className="min-w-[324px] ">
      <CardHeader>
        <div className=" flex items-center justify-center space-x-2 px-2">
          <Users className='text-primary h-5 w-5 ' />
          <h3 className=" text-lg font-semibold"> Student </h3>
        </div>
      </CardHeader>
      <CardBody className=" flex justify-center items-center">
        <PieChart width={300} height={200}>
          <Tooltip />
          <Pie
            data={studentStatsChartsData}
            cx="50%"
            cy="50%"
            strokeWidth={3}
            innerRadius={62}
            outerRadius={90}
            dataKey="value"
            startAngle={25}
            endAngle={385}
          >
            {studentStatsChartsData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </CardBody>
      <CardFooter>
        <div className=" space-y-3 text-sm w-full px-4 mb-3 ">
          {studentStatsChartsData.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-md"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className=" text-sm font-medium">{item.name}</span>
              </div>
              <span className=" text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

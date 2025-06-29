import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StepsConters } from '@/types/step-conters';

type LeaderboardProps = {
  StepConterData: StepsConters[];
};

export default function LeaderBoard({ StepConterData }: LeaderboardProps) {
  const top3 = [...StepConterData]
    .filter((item) => item?.user)
    .sort((a, b) => b.stepCount - a.stepCount)
    .slice(0, 3)
    .map((item) => {
      return {
        ...item,
        fullName:
          `${item.user.name.first ?? ''} ${item.user.name.middle ?? ''} ${item.user.name.last ?? ''}`.trim() ||
          'ไม่ระบุชื่อ',
      };
    });


  return (
    <>
      <div className="flex justify-center items-center w-full h-[50%] my-5">
        <div className="w-[80%]">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={top3}
              layout="horizontal"
              margin={{ top: 20, right: 0, left: 0 }}
              barGap={0}
              barCategoryGap={0}
            >
              <XAxis dataKey="fullName" tick={{ fontSize: 14 }} />
              <YAxis hide={true} />
              <Tooltip />
              <Bar
                dataKey="stepCount"
                fill="#8884d8"
                radius={[10, 10, 0, 0]}
                label={{ position: 'top' }}
                barSize={120} 
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

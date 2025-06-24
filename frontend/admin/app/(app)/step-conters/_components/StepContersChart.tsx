import { StepsConters } from '@/types/step-conters';
import { Bar, BarChart, CartesianGrid, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type StepContersTableProps = {
  stepCounters: StepsConters[];
};

const data = [
  {
    name: 'Napus Samuanpho',
    stepsConter: 4000,
  },
  {
    name: 'Wansan Wasin',
    stepsConter: 3000,
  },
  {
    name: 'Wantana Suwannapho',
    stepsConter: 2000,
  },
];

export default function InformationChart({
  stepCounters,
}: StepContersTableProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="stepsConter" barSize={50}  fill="#8884d8" activeBar={{ stroke: 'red', strokeWidth: 2 }} />
          <LabelList dataKey="stepsConter" position="top" style={{ fill: '#333', fontSize: 14, fontWeight: 'bold' }}/>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

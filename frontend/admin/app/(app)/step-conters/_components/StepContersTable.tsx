import { StepsConters } from '@/types/step-conters';
import UserTable from './StepcontersUserTable';
import InformationChart from './StepContersChart';

type StepContersTableProps = {
  stepCounters: StepsConters[];
};

export default function StepContersTable({
  stepCounters,
}: StepContersTableProps) {
  return (
    <div className=' flex flex-col justify-center items-center  w-full h-fit px-10 py-5 gap-5'>
      <InformationChart stepCounters={stepCounters} />
      <UserTable stepCounters={stepCounters}/>
    </div>
  );
}

import { StepsCounters } from '@/types/step-counters';
import UserTable from './StepcountersUserTable';

type StepContersTableProps = {
  stepCounters: StepsCounters[];
};

export default function StepContersTable({
  stepCounters,
}: StepContersTableProps) {
  return (
    <div className=' flex flex-col justify-center items-center  w-full h-fit px-10 py-5 gap-5'>
      <UserTable stepCounters={stepCounters}/>
    </div>
  );
}
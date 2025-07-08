import { StepContersTableProps } from '@/types/step-counters';
import UserTable from './StepcountersUserTable';

export default function StepContersTable({
  stepCounters,
}: StepContersTableProps) {
  return (
    <div className=' flex flex-col justify-center items-center  w-full h-fit px-10 py-5 gap-5'>
      <UserTable stepCounters={stepCounters}/>
    </div>
  );
}
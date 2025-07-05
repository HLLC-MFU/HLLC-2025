import React from 'react';
import { Flower, Activity, TriangleAlert, TicketPercent } from 'lucide-react';
import { Card } from '@heroui/react';
import { useReports } from '@/hooks/useReports';
import { useActivities } from '@/hooks/useActivities';
import { useEvoucher } from '@/hooks/useEvoucher';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';

interface CardProp {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  colors: string;
}

function CardWithPie({ label, value, icon, colors }: CardProp) {
  return (
    <Card className="w-full h-full rounded-2xl flex-row flex items-center gap-4 p-5">
      <div
        className={`p-4 rounded-2xl bg-${colors} text-${colors.replace('100', '600')} shadow-inner`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-md font-medium text-default-800">{label}</span>
        <span className="text-lg font-semibold text-default-500">{value} </span>
      </div>
    </Card>
  );
}

export default function Overview() {
  const { evouchers } = useEvoucher();
  const { activities } = useActivities();
  const { lamduanFlowers } = useLamduanFlowers();
  const { problems } = useReports();

  return (
    <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4  gap-6 my-6">
      <CardWithPie
        label="Total Activity"
        value={activities.length}
        icon={<Activity />}
        colors="green-100"
      />
      <CardWithPie
        label="LamduanFlower"
        value={lamduanFlowers.length}
        icon={<Flower className=" text-yellow-600" />}
        colors="yellow-100"
      />
      <CardWithPie
        label="Evoucher"
        value={evouchers.length}
        icon={<TicketPercent />}
        colors="orange-100"
      />
      <CardWithPie
        label="Report"
        value={problems.length}
        icon={<TriangleAlert />}
        colors="red-100"
      />
    </div>
  );
}

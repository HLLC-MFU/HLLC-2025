import { useActivity } from '@/hooks/useActivity';
import { Select, SelectItem } from '@heroui/react';
import { useEffect, useState } from 'react';

interface SelectProps {
  selectedActivityIds: string[];
  setSelectActivityIds: (ids: string[]) => void;
  forceVisible?: boolean;
}

export default function Selectdropdown({
  selectedActivityIds,
  setSelectActivityIds,
  forceVisible = false,
}: SelectProps) {
  const { activities, fetchActivities } = useActivity();

  console.log('Activities:', activities);
  return (
    <Select
      className={`w-full max-w-xl text-sm sm:overflow-hidden text-center ${forceVisible ? '' : 'sm:hidden'}`}
      label="Select Activities"
      placeholder="เลือกกิจกรรม"
      selectionMode="multiple"
      selectedKeys={new Set(selectedActivityIds)}
      onSelectionChange={keys => {
        const selected = Array.from(keys) as string[];
        setSelectActivityIds(selected);
      }}
    >
      {activities.map(activity => (
        <SelectItem key={activity._id}>{activity.shortName.en}</SelectItem>
      ))}
    </Select>
  );
}

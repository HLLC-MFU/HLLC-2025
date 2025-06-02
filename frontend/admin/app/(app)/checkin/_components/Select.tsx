import { divider, Select, SelectItem } from '@heroui/react';
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
  const [activity, setActivity] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fecthActivity = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/activities');
        const json = await res.json();
        const activityList = json.data.map((activity: any) => ({
          id: activity._id,
          name: activity.shortName.en,
        }));

        setActivity(activityList);
      } catch (err) {
        console.error('Fetch failed', err);
      }
    };

    fecthActivity();
  }, []);

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
      {activity.map(activity => (
        <SelectItem key={activity.id}>{activity.name}</SelectItem>
      ))}
    </Select>
  );
}

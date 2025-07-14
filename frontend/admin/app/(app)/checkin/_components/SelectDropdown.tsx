import { Activities } from '@/types/activities';
import { Select, SelectItem } from '@heroui/react';

type SelectdropdownProps = {
  selectedActivityId: string[];
  setSelectActivityId: (id: string[]) => void;
  activities: Activities[];
};

export default function Selectdropdown({
  selectedActivityId,
  setSelectActivityId,
  activities,
}: SelectdropdownProps) {
  return (
    <Select
      className={`w-full text-sm sm:overflow-hidden text-center`}
      label="Select Activities"
      selectionMode="multiple"
      selectedKeys={new Set(selectedActivityId)}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys) as string[];
        setSelectActivityId(selected);
      }}
    >
      {(activities ?? []).map((activity) => (
        <SelectItem key={activity._id} textValue={activity.name.en}>
          <div className="flex flex-col">
            <span>{activity?.name?.en}</span>
            <span className="text-sm text-default-500">
              ( {activity?.name?.th} )
            </span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}

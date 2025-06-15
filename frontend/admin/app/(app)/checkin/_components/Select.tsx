import { useActivities } from '@/hooks/useActivities';
import { Select, SelectItem } from '@heroui/react';

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
  const { activities } = useActivities();

  return (
    <Select
      className={`w-full max-w-xl text-sm sm:overflow-hidden text-center ${forceVisible ? '' : 'sm:hidden'}`}
      label="Select Activities"
      selectionMode="multiple"
      selectedKeys={new Set(selectedActivityIds)}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys) as string[];
        setSelectActivityIds(selected);
      }}
    >
      {(activities ?? []).map((activity) => (
        <SelectItem
          key={activity._id}
          textValue={activity.name.en} 
        >
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
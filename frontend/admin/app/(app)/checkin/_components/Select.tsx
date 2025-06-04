import { useActivity } from '@/hooks/useActivity';
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
  const { activities } = useActivity();

  return (
    <Select
      className={`w-full max-w-xl text-sm sm:overflow-hidden text-center ${forceVisible ? '' : 'sm:hidden'}`}
      label="Select Activities"
      placeholder="เลือกกิจกรรม"
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
          textValue={activity?.shortName?.en} // 👈 ใช้อันนี้เพื่อให้แสดงเฉพาะ en ตอนเลือก
        >
          <div className="flex flex-col">
            <span>{activity?.shortName?.en}</span>
            <span className="text-sm text-default-500">
              ( {activity?.shortName?.th} )
            </span>
          </div>
        </SelectItem>
      ))}
    </Select>

  );
}
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
  const nameCount: Record<string, number> = {};
  for (const act of activities) {
    const name = act.name.en;
    nameCount[name] = (nameCount[name] || 0) + 1;
  }

  const withChipGroup: Record<string, Activities[]> = {};
  const noChip: Activities[] = [];

  for (const act of activities) {
    const nameEn = act.name.en;
    if (nameCount[nameEn] > 1) {
      if (!withChipGroup[nameEn]) withChipGroup[nameEn] = [];
      withChipGroup[nameEn].push(act);
    } else {
      noChip.push(act);
    }
  }

  const sortedWithChip: Activities[] = Object.entries(withChipGroup)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([_, acts]) =>
      acts.sort((a, b) => a.acronym.localeCompare(b.acronym))
    );

  const sortedNoChip = noChip.sort((a, b) =>
    a.name.en.localeCompare(b.name.en)
  );

  const finalActivities = [...sortedWithChip, ...sortedNoChip];

  return (
    <Select
      className="w-full text-sm text-center"
      label="Select Activities"
      selectionMode="multiple"
      selectedKeys={new Set(selectedActivityId)}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys) as string[];
        setSelectActivityId(selected);
      }}
    >
      {finalActivities.map((activity) => {
        const showChip = nameCount[activity.name.en] > 1;
        return (
          <SelectItem
            key={activity._id}
            textValue={activity.name.en}
            startContent={
              showChip ? (
                <div className="inline-flex items-center justify-center rounded-xl bg-gray-200 w-12 h-8 text-xs font-medium text-gray-700">
                  {activity.acronym.split('-')[0]}
                </div>
              ) : null
            }
          >
            <div className="flex flex-col text-left">
              <span>{activity.name.en}</span>
              <span className="text-sm text-default-500">
                ({activity.name.th})
              </span>
            </div>
          </SelectItem>
        );
      })}
    </Select>
  );
}

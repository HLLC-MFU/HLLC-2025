import { PlusIcon, SearchIcon } from 'lucide-react';
import { Button, Input } from '@heroui/react';

interface TopContentProps {
  filterValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onClear: () => void;
}

export function TopContent({
  filterValue,
  onSearchChange,
  onAdd,
  onClear,
}: TopContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="Search sponsors..."
          startContent={<SearchIcon />}
          value={filterValue}
          onValueChange={onSearchChange}
          onClear={onClear}
        />
        <Button
          className="flex-1 sm:flex-none"
          color="primary"
          endContent={<PlusIcon />}
          onPress={onAdd}
        >
          Add Sponsor
        </Button>
      </div>
    </div>
  );
}

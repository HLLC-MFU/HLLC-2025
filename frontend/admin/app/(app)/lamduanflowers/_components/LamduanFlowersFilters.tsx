import {
  SearchIcon,
} from "lucide-react";
import {
  Input,
} from "@heroui/react";

const sortOptions = [
  { name: "name", label: "Name" },
  { name: "isShow", label: "Show" },
];

interface LamduanFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}


export function LamduanFilters({
  searchQuery,
  onSearchQueryChange,
}: LamduanFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        isClearable
        value={searchQuery}
        onValueChange={onSearchQueryChange}
        className="w-full"
        placeholder="Search Lamduan Flowers..."
        startContent={<SearchIcon className="text-default-400" />}
      />
    </div>
  );
}

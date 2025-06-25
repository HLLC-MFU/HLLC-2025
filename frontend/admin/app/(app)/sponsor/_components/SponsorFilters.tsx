import {
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import {
  Button,
  Input,
} from "@heroui/react";

interface SponsorFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onAddSponsor: () => void;
}

export function SponsorFilters({
  searchQuery,
  onSearchQueryChange,
  onAddSponsor,
}: SponsorFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Input
          isClearable
          className="w-full"
          placeholder="Search sponsors..."
          startContent={<SearchIcon className="text-default-400" />}
          value={searchQuery}
          onValueChange={onSearchQueryChange}
        />
        <Button
          className="flex-1 sm:flex-none"
          color="primary"
          endContent={<PlusIcon />}
          onPress={onAddSponsor}
        >
          Add Sponsor
        </Button>
      </div>
    </div>
  );
}

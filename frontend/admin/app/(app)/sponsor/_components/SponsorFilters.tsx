import {
  AArrowDownIcon,
  AArrowUpIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";

const sortOptions = [
  { name: "name", label: "Name" },
  { name: "isShow", label: "Show" },
];

interface SponsorFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortByChange: (key: string) => void;
  onSortDirectionToggle: () => void;
  onAddSponsor: () => void;
}

export function SponsorFilters({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionToggle,
  onAddSponsor,
}: SponsorFiltersProps) {
  const currentSortLabel =
    sortOptions.find((opt) => opt.name === sortBy)?.label ?? sortBy;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Input
          isClearable
          value={searchQuery}
          onValueChange={onSearchQueryChange}
          className="w-full"
          placeholder="Search sponsors..."
          startContent={<SearchIcon className="text-default-400" />}
        />

        <div className="flex gap-2 sm:gap-3">
          <ButtonGroup className="flex-1 sm:flex-none">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat" className="w-full sm:w-auto">
                  Sort by: {currentSortLabel}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sort Options"
                onAction={(key) => onSortByChange(String(key))}
              >
                {sortOptions.map(({ name, label }) => (
                  <DropdownItem key={name} className="capitalize">
                    {label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Button
              variant="flat"
              isIconOnly
              onPress={onSortDirectionToggle}
              className="flex-shrink-0"
            >
              {sortDirection === "asc" ? <AArrowUpIcon /> : <AArrowDownIcon />}
            </Button>
          </ButtonGroup>

          <Button
            color="primary"
            endContent={<PlusIcon />}
            onPress={onAddSponsor}
            className="flex-1 sm:flex-none"
          >
            Add Sponsor
          </Button>
        </div>
      </div>
    </div>
  );
}

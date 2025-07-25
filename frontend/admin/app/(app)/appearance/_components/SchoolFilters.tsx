import { Button, Input, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, ButtonGroup } from "@heroui/react";
import { SearchIcon, AArrowUpIcon, AArrowDownIcon } from "lucide-react";
import { Key } from "react";

const sortOptions = [
  { name: "name", label: "Name" },
  { name: "acronym", label: "Acronym" },
  { name: "majors", label: "Number of Majors" }
];

interface SchoolFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortByChange: (key: string) => void;
  onSortDirectionToggle: () => void;
}

export function SchoolFilters({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionToggle,
}: SchoolFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          isClearable
          className="w-full"
          placeholder="Search Schools..."
          startContent={<SearchIcon className="text-default-400" />}
          value={searchQuery}
          onValueChange={onSearchQueryChange}
        />
        <div className="flex gap-2 sm:gap-3">
          <ButtonGroup className="flex-1 sm:flex-none">
            <Dropdown>
              <DropdownTrigger>
                <Button className="w-full sm:w-auto" variant="flat">
                  Sort by: {sortOptions.find(opt => opt.name === sortBy)?.label}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sort Options"
                onAction={(key: Key) => onSortByChange(key.toString())}
              >
                {sortOptions.map((option) => (
                  <DropdownItem key={option.name} className="capitalize">
                    {option.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              isIconOnly
              className="flex-shrink-0"
              variant="flat"
              onPress={onSortDirectionToggle}
            >
              {sortDirection === "asc" ? <AArrowUpIcon /> : <AArrowDownIcon />}
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}

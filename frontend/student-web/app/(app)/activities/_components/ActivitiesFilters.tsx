import { Button, Input, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, ButtonGroup } from "@heroui/react";
import { SearchIcon, AArrowUpIcon, AArrowDownIcon } from "lucide-react";
import { Key } from "react";

const sortOptions = [
  { name: "name", label: "Name" },
  { name: "acronym", label: "Acronym" },
];

type ActivitiesFiltersProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortByChange: (key: string) => void;
  onSortDirectionToggle: () => void;
}

export function ActivitiesFilters({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionToggle,
}: ActivitiesFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          isClearable
          value={searchQuery}
          onValueChange={onSearchQueryChange}
          className="w-full"
          placeholder="Search activities..."
          startContent={<SearchIcon className="text-default-400" />}
        />
        {/* <div className="flex gap-2 sm:gap-3">
          <ButtonGroup className="flex-1 sm:flex-none">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat" className="w-full sm:w-auto">
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
              variant="flat"
              isIconOnly
              onPress={onSortDirectionToggle}
              className="flex-shrink-0"
            >
              {sortDirection === "asc" ? <AArrowUpIcon /> : <AArrowDownIcon />}
            </Button>
          </ButtonGroup>
        </div> */}
      </div>
    </div>
  );
}

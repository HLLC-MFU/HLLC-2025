import { Button, ButtonGroup } from "@heroui/button";
import { Input } from "@heroui/input";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { AArrowDownIcon, AArrowUpIcon, SearchIcon } from "lucide-react";
import CardLamduanFlowers from "./CardLamduanFlowers";

const sortOptions = [
    { name: "user", label: "Username" }
];

interface LamduanFiltersProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    sortBy: string;
    sortDirection: "asc" | "desc";
    onSortByChange: (key: string) => void;
    onSortDirectionToggle: () => void;
}

export function LamduanFlowersFilters({
    searchQuery,
    onSearchQueryChange,
    sortBy,
    sortDirection,
    onSortByChange,
    onSortDirectionToggle,
}: LamduanFiltersProps) {
    const currentSortLabel = sortOptions.find((opt) => opt.name === sortBy)?.label ?? sortBy;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Input
                    isClearable
                    value={searchQuery}
                    onValueChange={onSearchQueryChange}
                    className="w-full"
                    placeholder="Search user id..."
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
                </div>
            </div>
        </div>
    );
}
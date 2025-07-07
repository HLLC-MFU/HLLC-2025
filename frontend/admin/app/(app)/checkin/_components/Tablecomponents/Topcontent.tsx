// TopContent.tsx
import React from 'react';
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { ChevronDown, Plus, Search } from 'lucide-react';

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

interface TopContentProps {
  filterValue: string;
  onClear: () => void;
  onSearchChange: (val: string) => void;
  activityFilter: Set<string>;
  setActivityFilter: (val: Set<string>) => void;
  visibleColumns: Set<string>;
  setVisibleColumns: (val: Set<string>) => void;
  activities: any[];
  columns: { name: string; uid: string }[];
  usersLength: number;
  onTypingPress: () => void;
}

export default function TopContent({
  filterValue,
  onClear,
  onSearchChange,
  activityFilter,
  setActivityFilter,
  visibleColumns,
  setVisibleColumns,
  activities,
  columns,
  usersLength,
  onTypingPress,
}: TopContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="Search by StudentID..."
          startContent={<Search />}
          value={filterValue}
          onClear={onClear}
          onValueChange={onSearchChange}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                variant="flat"
              >
                Activity
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              key={activities?.length || 'no-activities'} // <-- บังคับรีเฟรชเมื่อ activities มา
              aria-label="Activity Filter"
              closeOnSelect={false}
              selectedKeys={activityFilter}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys) as string[];

                setActivityFilter(new Set(selected));
              }}
            >
              {(activities ?? []).map((activty) => (
                <DropdownItem
                  key={String(activty._id)}
                  className="capitalize"
                >
                  {capitalize(
                    typeof activty.name === 'string'
                      ? activty.name
                      : activty.shortName?.en ?? 'Untitled'
                  )}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                variant="flat"
              >
                Columns
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={visibleColumns}
              selectionMode="multiple"
              onSelectionChange={keys =>
                setVisibleColumns(new Set(keys as unknown as string[]))
              }
            >
              {columns.map(column => (
                <DropdownItem key={column.uid} className="capitalize">
                  {capitalize(column.name)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Button
            color="primary"
            endContent={<Plus />}
            onPress={onTypingPress}
          >
            Typing
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {usersLength} users
        </span>
      </div>
    </div>
  );
}

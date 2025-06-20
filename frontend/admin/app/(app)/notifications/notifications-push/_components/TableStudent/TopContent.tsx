import React from 'react';
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { ChevronDown, Search } from 'lucide-react';
import { School } from '@/types/school';
import { Major } from '@/types/major';

interface TopContentStudentProps {
  filterValue: string;
  onSearchChange: (val: string) => void;
  onClear: () => void;
  majorFilter: Set<string>;
  setMajorFilter: (val: Set<string>) => void;
  schoolFilter: Set<string>;
  setSchoolFilter: (val: Set<string>) => void;
  majors: Major[];
  schools: School[];
  usersLength: number;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
} 

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

export default function TopContent({
  filterValue,
  onSearchChange,
  onClear,
  majorFilter,
  setMajorFilter,
  schoolFilter,
  setSchoolFilter,
  majors,
  schools,
  usersLength,
  onRowsPerPageChange,
}: TopContentStudentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          classNames={{
            base: 'w-full sm:max-w-[44%]',
            inputWrapper: 'border-1',
          }}
          placeholder="Search by Student Id"
          size="sm"
          startContent={<Search className="text-default-300" />}
          value={filterValue}
          variant="bordered"
          onClear={onClear}
          onValueChange={onSearchChange}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                size="sm"
                variant="flat"
              >
                Major
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select Majors"
              closeOnSelect={false}
              selectedKeys={majorFilter}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys) as string[];
                setMajorFilter(new Set(selected));
              }}
              className="max-h-48 overflow-y-auto scrollbar-none"
            >
              {(majors ?? []).map((major) => (
                <DropdownItem key={major._id ?? `major-${major.name.en}`} className="capitalize">
                  {capitalize(major.name.en)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                size="sm"
                variant="flat"
              >
                School
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="select schools"
              closeOnSelect={false}
              selectionMode="multiple"
              selectedKeys={schoolFilter}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys) as string[];
                setSchoolFilter(new Set(selected));
              }}
              className="max-h-48 overflow-y-auto"
            >
              {(schools ?? []).map((school) => (
                <DropdownItem key={school._id} className="capitalize">
                  {capitalize(school.name.en)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {usersLength} users
        </span>
        <label className="flex items-center text-default-400 text-small">
          Rows per page:
          <select
            className="bg-transparent outline-none text-default-400 text-small"
            onChange={onRowsPerPageChange}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>
    </div>
  );
}

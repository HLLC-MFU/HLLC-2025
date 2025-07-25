import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from '@heroui/react';
import { Search, ChevronDown } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface TopContentProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  types: string[];
  setTypes: Dispatch<SetStateAction<string[]>>;
  uniqueScopes: string[];
}

export default function TopContent({search,setSearch,types,setTypes,uniqueScopes}: TopContentProps) {
  return (
    <>
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          classNames={{
            base: 'w-full sm:max-w-[35%]',
            inputWrapper: 'border-1',
          }}
          placeholder="Search by Title name"
          size="md"
          startContent={<Search className="text-default-300" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                size="md"
                variant="flat"
              >
                Type
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select Types"
              className="max-h-48 overflow-y-auto"
              closeOnSelect={false}
              selectedKeys={new Set(types)}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys) as string[];

                setTypes(selected);
              }}
            >
              {uniqueScopes.map((scope) => (
                <DropdownItem key={scope} className="capitalize">
                  {scope}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </>
  );
}

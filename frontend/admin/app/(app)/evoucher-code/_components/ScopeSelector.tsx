import { useMemo } from 'react';
import {
  Input,
  Button,
  ScrollShadow,
} from '@heroui/react';
import { Search, X } from 'lucide-react';

type ScopeSelectorProps<T> = {
  label: string;
  icon: React.ElementType;
  items: T[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  placeholder: string;
  getName: (item: T) => string;
  getId: (item: T) => string;
  searchFields: (item: T) => (string | undefined)[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ScopeSelector<T>({
  label,
  icon: Icon,
  items,
  selectedItems,
  onSelect,
  onRemove,
  isLoading,
  isDisabled = false,
  placeholder,
  getName,
  getId,
  searchFields,
  searchQuery,
  setSearchQuery,
}: ScopeSelectorProps<T>) {
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    return items.filter((item) =>
      searchFields(item).some((field) =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [items, searchQuery, searchFields]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <Input
        endContent={
          searchQuery ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSearchQuery("")}
            >
              <X size={14} />
            </Button>
          ) : null
        }
        isDisabled={isDisabled}
        placeholder={placeholder}
        size="sm"
        startContent={<Search className="text-default-400" size={16} />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      <ScrollShadow className="max-h-[250px] px-2 py-1">
        {isLoading ? (
          <div className="text-center text-default-500 py-2">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-default-500 py-2">No users found</div>
        ) : (
          filteredItems.map((item) => {
            const id = getId(item);
            const isSelected = selectedItems.includes(id);

            return (
              <Button
                key={id}
                className={`w-full justify-start h-unit-10 px-2 ${isSelected ? 'bg-primary/10 text-primary' : ''
                  }`}
                variant={isSelected ? 'flat' : 'light'}
                onPress={() => {
                  if (isSelected) {
                    onRemove(id);
                  } else {
                    onSelect(id);
                  }
                }}
              >
                {getName(item)}
              </Button>
            );
          })
        )}
      </ScrollShadow>
    </div>
  );
}

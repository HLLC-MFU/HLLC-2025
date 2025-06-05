import { useState, useMemo } from 'react';
import {
  Card,
  Input,
  Chip,
  ScrollShadow,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
} from '@heroui/react';
import { Search, X, ChevronDown } from 'lucide-react';

interface ScopeSelectorProps<T> {
  label: string;
  icon: React.ElementType;
  items: T[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
  placeholder: string;
  getName: (item: T) => string;
  getId: (item: T) => string;
  searchFields: (item: T) => (string | undefined)[];
}

export function ScopeSelector<T>({
  label,
  icon: Icon,
  items,
  selectedItems,
  onSelect,
  onRemove,
  isLoading,
  placeholder,
  getName,
  getId,
  searchFields,
}: ScopeSelectorProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    return items.filter((item) =>
      searchFields(item).some(
        (field) =>
          field && field.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [items, searchQuery, searchFields]);

  const selectedItemsData = useMemo(
    () => items.filter((item) => selectedItems.includes(getId(item))),
    [items, selectedItems, getId],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <Popover 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        placement="bottom"
      >
        <PopoverTrigger>
          <Button
            variant="flat"
            className="w-full justify-between h-unit-12 px-3"
            endContent={<ChevronDown className="text-default-500" size={16} />}
          >
            <div className="flex items-center gap-2">
              <span className="text-default-500">
                {selectedItems.length
                  ? `${selectedItems.length} selected`
                  : placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Card className="w-full shadow-none border-none">
            <div className="p-2 border-b">
              <Input
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Search..."
                size="sm"
                startContent={<Search size={16} className="text-default-400" />}
                endContent={
                  searchQuery ? (
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => setSearchQuery('')}
                    >
                      <X size={14} />
                    </Button>
                  ) : null
                }
              />
            </div>
            <ScrollShadow className="max-h-[300px]">
              <div className="p-2 flex flex-col gap-1">
                {isLoading ? (
                  <div className="p-2 text-center text-default-500">Loading...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-2 text-center text-default-500">No items found</div>
                ) : (
                  filteredItems.map((item) => {
                    const id = getId(item);
                    const isSelected = selectedItems.includes(id);
                    return (
                      <Button
                        key={id}
                        className={`w-full justify-start h-unit-10 px-2 ${
                          isSelected ? 'bg-primary/10 text-primary' : ''
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
              </div>
            </ScrollShadow>
          </Card>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-1 min-h-[40px]">
        {selectedItemsData.map((item) => (
          <Chip
            key={getId(item)}
            onClose={() => onRemove(getId(item))}
            variant="flat"
            size="sm"
          >
            {getName(item)}
          </Chip>
        ))}
      </div>
    </div>
  );
} 
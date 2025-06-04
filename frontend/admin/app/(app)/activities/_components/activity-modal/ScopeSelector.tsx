import { Select, SelectItem, Chip } from "@heroui/react";

interface ScopeSelectorProps<T> {
  label: string;
  icon: any;
  items: T[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
  placeholder: string;
  getName: (item: T) => string;
  getId: (item: T) => string | undefined;
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
  getId
}: ScopeSelectorProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium">{label}</h4>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        {selectedItems.map((id) => {
          const item = items.find(i => getId(i) === id);
          return (
            <Chip
              key={id}
              onClose={() => onRemove(id)}
              variant="flat"
              size="sm"
            >
              {item ? getName(item) : id}
            </Chip>
          );
        })}
      </div>
      <Select
        placeholder={placeholder}
        selectedKeys={[]}
        onChange={(e) => onSelect(e.target.value)}
        isLoading={isLoading}
        className="w-full"
      >
        {items
          .filter(item => {
            const id = getId(item);
            return id && !selectedItems.includes(id);
          })
          .map((item) => {
            const id = getId(item);
            if (!id) return null;
            return (
              <SelectItem key={id}>
                {getName(item)}
              </SelectItem>
            );
          })}
      </Select>
    </div>
  );
} 
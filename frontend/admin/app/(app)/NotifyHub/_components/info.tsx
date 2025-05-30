import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem, Avatar } from '@heroui/react';
import { Star, School, BookMarked, CircleCheckBig } from 'lucide-react';
import { useState } from 'react';

export const icons = [
  {
    id: 1,
    name: 'Star',
    icon: Star,
  },
  {
    id: 2,
    name: 'Book',
    icon: BookMarked,
  },
  {
    id: 3,
    name: 'School',
    icon: School,
  },
  {
    id: 4,
    name: 'Correct',
    icon: CircleCheckBig,
  },
];

export function Informationinfo() {
  const [selected, setSelected] = useState<(typeof icons)[0] | undefined>(
    undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold  justify-center ">
          Information Info
        </h1>
        <Select
          className="w-56"
          label="Select Icons"
          size="md"
          selectedKeys={selected ? [selected.name] : []}
          onSelectionChange={keys => {
            const name = Array.from(keys)[0];
            const item = icons.find(i => i.name === name);
            setSelected(item);
          }}
          renderValue={() =>
            selected ? (
              <div className="flex items-center gap-2">
                <selected.icon className="w-5 h-5" />
                <span>{selected.name}</span>
              </div>
            ) : null
          }
        >
          {icons.map(item => {
            const Icon = item.icon;
            return (
              <SelectItem
                key={item.name}
                startContent={<Icon className="w-5 h-5" />}
              >
                {item.name}
              </SelectItem>
            );
          })}
        </Select>
      </div>

      <h1 className="text-xl font-bold"> Title </h1>
      <div className="flex flex-row justify-between gap-5">
        <Input label="EN" size="md" type="Text" />

        <Input label="TH" size="md" type="Text" />
      </div>

      <h1 className="text-xl font-bold"> Subtitle</h1>
      <div className="flex flex-row justify-between gap-5">
        <Input label="EN" size="md" type="Text" />

        <Input label="TH" size="md" type="Text" />
      </div>

      <h1 className="text-xl font-bold"> Description </h1>
      <div className="flex flex-row justify-between gap-5">
        <Textarea label="EN" />

        <Textarea label="TH" />
      </div>

      <h1 className="text-xl font-bold"> Imange </h1>
    </div>
  );
}

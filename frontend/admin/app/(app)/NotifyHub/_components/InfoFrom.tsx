import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem, Avatar } from '@heroui/react';
import { Star, School, BookMarked, CircleCheckBig } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageUploader } from './imageupload';

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

type InformationInfoData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  description: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
};

type InformationinfoProps = {
  onChange?: (data: InformationInfoData) => void;
};

export function Informationinfo({ onChange }: InformationinfoProps) {
  const [selected, setSelected] = useState<(typeof icons)[0] | undefined>(
    undefined,
  );

  const [title, setTitle] = useState({ en: '', th: '' });
  const [subtitle, setSubtitle] = useState({ en: '', th: '' });
  const [description, setDescription] = useState({ en: '', th: '' });
  const [redirect, setRedirect] = useState({ en: '', th: '', link: '' });

  useEffect(() => {
    const data = {
      icon: selected?.icon,
      title,
      subtitle,
      description,
      redirect,
    };
    if (onChange) {
      onChange(data); // 🔁 ส่งข้อมูลออกทุกครั้งที่เปลี่ยน
    }
  }, [selected, title, subtitle, description, redirect, onChange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold  justify-center ">
          Information Info
        </h1>
        <Select
          className="w-56 bg-white border border-gray-300 rounded-lg shadow-sm"
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

      {/* Title */}
      <h1 className="text-xl font-bold"> Title </h1>
      <div className="flex flex-row justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={title.en}
          onChange={e => setTitle({ ...title, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={title.th}
          onChange={e => setTitle({ ...title, th: e.target.value })}
        />
      </div>

      {/* Subtitle */}
      <h1 className="text-xl font-bold"> Subtitle</h1>
      <div className="flex flex-row justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={subtitle.en}
          onChange={e => setSubtitle({ ...subtitle, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={subtitle.th}
          onChange={e => setSubtitle({ ...subtitle, th: e.target.value })}
        />
      </div>

      <h1 className="text-xl font-bold"> Description </h1>
      <div className="flex flex-row justify-between gap-5">
        <Textarea
          label="English"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={description.en}
          onChange={e => setDescription({ ...description, en: e.target.value })}
        />

        <Textarea
          label="Thai"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={description.th}
          onChange={e => setDescription({ ...description, th: e.target.value })}
        />
      </div>

      <h1 className="text-xl font-bold"> Redirect (Optional) </h1>
      <div className="grid grid-cols-2 justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={redirect.en}
          onChange={e => setRedirect({ ...redirect, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="Text"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={redirect.th}
          onChange={e => setRedirect({ ...redirect, th: e.target.value })}
        />
        <Input
          label="Link"
          size="md"
          type="Url"
          className="bg-white border border-gray-300 rounded-lg shadow-md"
          value={redirect.link}
          onChange={e => setRedirect({ ...redirect, link: e.target.value })}
        />
      </div>

      <h1 className="text-xl font-bold"> Imange (Optional) </h1>
      <ImageUploader />
    </div>
  );
}

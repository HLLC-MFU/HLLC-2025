import { Input, Textarea } from '@heroui/input';
import { image, Select, SelectItem } from '@heroui/react';
import { Star, School, BookMarked, CircleCheckBig } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageUploader } from './NotificationImageUpload';

type InformationInfoData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  body: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
  imageUrl?: string;
  imageFile?: File;
};

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


type InformationinfoProps = {
  onChange?: (data: InformationInfoData) => void;
  resetSignal?: number;
};

export function InformationForm({ onChange, resetSignal }: InformationinfoProps) {
  const [selected, setSelected] = useState<(typeof icons)[0] | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [title, setTitle] = useState({ en: '', th: '' });
  const [subtitle, setSubtitle] = useState({ en: '', th: '' });
  const [body, setBody] = useState({ en: '', th: '' });
  const [redirect, setRedirect] = useState({ en: '', th: '', link: '' });

  useEffect(() => {
    const data = { icon: selected?.icon, title, subtitle, body, redirect, imageUrl, imageFile };
    if (onChange) {
      onChange(data);
    }
  }, [selected, title, subtitle, body, redirect, imageUrl, onChange]);

  useEffect(() => {
    setSelected(undefined);
    setImageUrl(undefined);
    setImageFile(undefined);
    setTitle({ en: '', th: '' });
    setSubtitle({ en: '', th: '' });
    setBody({ en: '', th: '' });
    setRedirect({ en: '', th: '', link: '' });
  }, [resetSignal]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row justify-between">
        <h1 className="text-xl font-bold  justify-center ">
          Information Info
        </h1>
        <div className=" w-full max-w-[9rem] h-full">
          <Select
            className=" border border-gray-300 rounded-lg"
            label="Select Icons"
            size="sm"
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
      </div>

      {/* Title */}
      <h1 className="text-lg font-bold"> Title </h1>
      <div className="flex flex-row justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl"
          value={title.en}
          onChange={e => setTitle({ ...title, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl"
          value={title.th}
          onChange={e => setTitle({ ...title, th: e.target.value })}
        />
      </div>

      {/* Subtitle */}
      <h1 className="text-lg font-bold"> Subtitle</h1>
      <div className="flex flex-row justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl "
          value={subtitle.en}
          onChange={e => setSubtitle({ ...subtitle, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl "
          value={subtitle.th}
          onChange={e => setSubtitle({ ...subtitle, th: e.target.value })}
        />
      </div>

      <h1 className="text-lg font-bold"> Description </h1>
      <div className="flex flex-row justify-between gap-5 items-stretch">
        <div className="w-full h-full">
          <Textarea
            label="English"
            className="bg-white border border-gray-300 rounded-xl "
            value={body.en}
            onChange={e =>
              setBody({ ...body, en: e.target.value })
            }
          />
        </div>
        <div className="w-full h-full">
          <Textarea
            label="Thai"
            className="bg-white border border-gray-300 rounded-xl "
            value={body.th}
            onChange={e =>
              setBody({ ...body, th: e.target.value })
            }
          />
        </div>
      </div>

      <h1 className="text-lg font-bold"> Redirect Button (Optional) </h1>
      <div className="grid grid-cols-2 justify-between gap-5">
        <Input
          label="English"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl "
          value={redirect.en}
          onChange={e => setRedirect({ ...redirect, en: e.target.value })}
        />

        <Input
          label="Thai"
          size="md"
          type="text"
          className="bg-white border border-gray-300 rounded-xl "
          value={redirect.th}
          onChange={e => setRedirect({ ...redirect, th: e.target.value })}
        />
        <Input
          label="Link"
          size="md"
          type="url"
          className="bg-white border border-gray-300 rounded-xl "
          value={redirect.link}
          onChange={e => setRedirect({ ...redirect, link: e.target.value })}

        />
      </div>

      <h1 className="text-lg font-bold"> Image (Optional) </h1>
      <ImageUploader onChange={(file, url) => { setImageUrl(url); setImageFile(file ?? undefined) }}
      resetSignal={resetSignal} />
    </div>
  );
}
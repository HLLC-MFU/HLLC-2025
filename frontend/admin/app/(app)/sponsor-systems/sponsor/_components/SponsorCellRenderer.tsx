import { Lang } from '@/types/lang';
import { Sponsors } from '@/types/sponsors';
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { EllipsisVertical, ImageIcon, Pen, Trash } from 'lucide-react';
import { useState } from 'react';

export type SponsorColumnKey =
  | 'logo'
  | 'name'
  | 'colors'
  | 'priority'
  | 'actions';

type SponsorCellRendererProps = {
  sponsor: Sponsors;
  columnKey: SponsorColumnKey;
  onEdit: () => void;
  onDelete: () => void;
};

export default function SponsorCellRenderer({
  sponsor,
  columnKey,
  onEdit,
  onDelete,
}: SponsorCellRendererProps) {
  const [imgError, setImgError] = useState(false);

  switch (columnKey) {
    case 'logo':
      return (
        (sponsor.logo.logoPhoto || !imgError) ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.logo.logoPhoto}`}
            alt={sponsor.name.en}
            className="rounded border border-default-300"
            height={64}
            width={64}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex justify-center items-center h-20 w-20 border border-default-300 rounded">
            <ImageIcon className="text-gray-500" />
          </div>
        )
      );
    case 'name':
      return (
        <div className="flex flex-col gap-4">
          {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
            <div key={lang} className="flex text-sm text-default-900 gap-1">
              <span className="font-medium text-default-400">
                {lang.toUpperCase()} :
              </span>
              <span>{sponsor.name?.[lang]}</span>
            </div>
          ))}
        </div>
      );
    case 'priority':
      return sponsor.priority;
    case 'colors':
      return (
        <div className="flex flex-col gap-2">
          {(['primary', 'secondary'] as const).map((value) => (
            <div
              key={value}
              className="flex items-center text-sm text-default-900 gap-1"
            >
              <span className="font-medium text-default-400">
                {value[0].toUpperCase() + value.slice(1)} :
              </span>
              {sponsor.color?.[value] ? (
                <Card
                  className="w-20 p-4 rounded"
                  style={{ backgroundColor: sponsor.color?.[value] }}
                />
              ) : (
                '-'
              )}
            </div>
          ))}
        </div>
      );
    case 'actions':
      return (
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light">
              <EllipsisVertical className="text-default-400" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem
              key="edit"
              startContent={<Pen size={16} />}
              onPress={onEdit}
            >
              Edit
            </DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              startContent={<Trash size={16} />}
              onPress={onDelete}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );

    default:
      return null;
  }
}

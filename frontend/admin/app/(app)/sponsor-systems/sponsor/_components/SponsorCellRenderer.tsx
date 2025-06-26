import { Sponsors } from '@/types/sponsors';
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { EllipsisVertical, ImageIcon, Pen, Trash } from 'lucide-react';
import { useState } from 'react';

export type SponsorColumnKey = 'logo' | 'name' | 'type' | 'display' | 'actions';

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

  if (!sponsor.photo || imgError) {
    return (
      <div className="flex justify-center items-center h-20 w-20 border border-default-300 rounded">
        <ImageIcon className="text-gray-500"/>
      </div>
    );
  }
  
  switch (columnKey) {
    case 'logo':
      return sponsor.photo && (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`}
          alt={sponsor.name.en}
          className="w-20 h-20 rounded border border-default-300"
          height={64}
          width={64}
          onError={() => setImgError(true)}
        />
      );
    case 'name':
      return (
        <div className="flex flex-col">
          <div className="flex text-sm text-default-900 gap-1">
            <span className="font-medium text-default-400">EN :</span>
            <span>{sponsor.name.en}</span>
          </div>
          <div className="flex text-sm text-default-900 gap-1">
            <span className="font-medium text-default-400">TH :</span>
            <span>{sponsor.name.th}</span>
          </div>
        </div>
      );
    case 'type':
      return sponsor.type.name;
    case 'display':
      return (
        <Chip color={sponsor.isShow ? 'primary' : 'danger'} variant="solid">
          {sponsor.isShow ? 'Show' : 'Hide'}
        </Chip>
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

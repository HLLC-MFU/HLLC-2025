import { Sponsors } from '@/types/sponsors';
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { EllipsisVertical, Pen, Trash } from 'lucide-react';

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
  switch (columnKey) {
    case 'logo':
      return sponsor.photo ? (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`}
          alt={sponsor.name.en}
          className="rounded border border-default-300 bg-white"
          height={64}
          width={64}
          onError={(e) => ((e.target as HTMLImageElement).src = '')}
        />
      ) : (
        <span className="text-default-500 italic bg-blue">No Logo</span>
      );
    case 'name':
      return (
        <div className="flex flex-col">
          <div className="flex text-sm text-default-900 gap-2">
            <label className="font-medium text-default-400">EN :</label>
            <label>{sponsor.name.en}</label>
          </div>
          <div className="flex text-sm text-default-900 gap-2">
            <label className="font-medium text-default-400">TH :</label>
            <label>{sponsor.name.th}</label>
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

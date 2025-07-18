import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { ChevronDown, ChevronUp, Pencil, Trash2, MoreVertical, CheckCircle, EyeOff, Eye } from 'lucide-react';

import { Activities } from '@/types/activities';

interface TableCellProps {
  activity: Activities;
  columnKey: React.Key;
  expandedKeys: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (typeId: string) => void;
  onDelete: (activity: Activities) => void;
}

export function TableCell({
  activity,
  columnKey,
  expandedKeys,
  onToggleExpand,
  onEdit,
  onDelete
}: TableCellProps) {
  switch (columnKey) {
    case 'acronym':
      return (
        <div className="flex items-center">
          <span className="text-sm font-semibold">
            {activity.acronym}
          </span>
        </div>
      );
    case 'name':
      return (
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{activity.name?.en}</span>
          <span className="text-xs text-default-500">
            {activity.name?.th}
          </span>
        </div>
      );
    case 'isVisible':
      return (
        <div className="flex justify-center">
          <Button
            className="justify-center min-w-20"
            color={activity.metadata?.isVisible ? 'default' : 'default'}
            size="sm"
            startContent={
              activity.metadata?.isVisible ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )
            }
            variant="flat"
          >
            {activity.metadata?.isVisible ? 'SHOW' : 'HIDE'}
          </Button>
        </div>
      );
    case 'isProgressCount':
      return (
        <div className="flex justify-center">
          <Button
            className="justify-center min-w-28"
            color={activity.metadata?.isProgressCount ? 'success' : 'default'}
            size="sm"
            startContent={
              activity.metadata?.isProgressCount ? (
                <CheckCircle size={14} />
              ) : null
            }
            variant="flat"
          >
            {activity.metadata?.isProgressCount ? 'PROGRESS' : 'NO PROGRESS'}
          </Button>
        </div>
      );
    case 'isOpen':
      return (
        <div className="flex justify-center">
          <Button
            className="justify-center min-w-20"
            color={activity.metadata?.isOpen ? 'success' : 'danger'}
            size="sm"
            variant="flat"
          >
            {activity.metadata?.isOpen ? 'OPEN' : 'CLOSED'}
          </Button>
        </div>
      );
    case 'actions':
      return (
        <div className="relative flex justify-end items-center gap-2">
          <Button
            isIconOnly
            className={
              expandedKeys.has(activity._id)
                ? 'text-primary'
                : 'text-default-400'
            }
            size="sm"
            variant="light"
            onPress={() => onToggleExpand(activity._id)}
          >
            {expandedKeys.has(activity._id) ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="text-default-300" size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Activity Actions">
              <DropdownItem
                key="edit"
                startContent={<Pencil size={16} />}
                onPress={() => onEdit(activity.type as string)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 size={16} />}
                onPress={() => onDelete(activity)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      );
    default:
      return null;
  }
} 
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { ChevronDown, ChevronUp, Pencil, Trash2, MoreVertical, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { Activities } from '@/types/activities';

interface TableCellProps {
  activity: Activities;
  columnKey: React.Key;
  expandedKeys: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (activity: Activities) => void;
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
          <span className="font-medium text-sm uppercase">
            {activity.acronym}
          </span>
        </div>
      );
    case 'name':
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{activity.name?.en}</span>
          <span className="text-xs text-default-500">
            {activity.name?.th}
          </span>
        </div>
      );
    case 'isVisible':
      return (
        <div className="flex justify-center">
          <Button
            size="sm"
            color={activity.metadata?.isVisible ? 'default' : 'default'}
            variant="flat"
            className="justify-center min-w-20"
            startContent={
              activity.metadata?.isVisible ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )
            }
          >
            {activity.metadata?.isVisible ? 'SHOW' : 'HIDE'}
          </Button>
        </div>
      );
    case 'isProgressCount':
      return (
        <div className="flex justify-center">
          <Button
            size="sm"
            color={activity.metadata?.isProgressCount ? 'success' : 'default'}
            variant="flat"
            className="justify-center min-w-28"
            startContent={
              activity.metadata?.isProgressCount ? (
                <CheckCircle size={14} />
              ) : null
            }
          >
            {activity.metadata?.isProgressCount ? 'PROGRESS' : 'NO PROGRESS'}
          </Button>
        </div>
      );
    case 'isOpen':
      return (
        <div className="flex justify-center">
          <Button
            size="sm"
            color={activity.metadata?.isOpen ? 'success' : 'danger'}
            variant="flat"
            className="justify-center min-w-20"
          >
            {activity.metadata?.isOpen ? 'OPEN' : 'CLOSED'}
          </Button>
        </div>
      );
    case 'actions':
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => onToggleExpand(activity._id)}
            className={
              expandedKeys.has(activity._id)
                ? 'text-primary'
                : 'text-default-400'
            }
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
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Activity Actions">
              <DropdownItem
                key="edit"
                startContent={<Pencil size={16} />}
                onPress={() => onEdit(activity)}
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
import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Activities } from '@/types/activities';
import { columns } from './TableColumns';
import { TableCell as TableCellComponent } from './TableCell';

interface ActivitiesTableProps {
  activities: Activities[];
  onEdit: (activity: Activities) => void;
  onDelete: (activity: Activities) => void;
}

export default function ActivitiesTable({
  activities,
  onEdit,
  onDelete,
}: ActivitiesTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set([]));

  const handleToggleExpand = (id: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(id)) {
      newExpandedKeys.delete(id);
    } else {
      newExpandedKeys.add(id);
    }
    setExpandedKeys(newExpandedKeys);
  };

  return (
    <Table
      aria-label="Activities table"
      removeWrapper
      classNames={{
        table: "w-full bg-white rounded-lg shadow-sm",
        th: "bg-default-100 text-default-400 font-semibold text-sm py-3 first:rounded-tl-lg last:rounded-tr-lg border-b border-default-200",
        td: "py-3 border-b border-default-100 last:border-b-0",
        tr: "hover:bg-default-50 transition-colors",
        wrapper: "max-h-[382px] shadow-lg rounded-lg overflow-hidden border border-default-200",
        thead: "[&>tr]:first:shadow-none",
        tbody: "before:content-[''] before:block before:h-0",
      }}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn
            key={column.uid}
            align={
              ['actions', 'isOpen', 'isProgressCount', 'isVisible'].includes(
                column.uid,
              )
                ? 'center'
                : 'start'
            }
          >
            {column.name}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent={'No activities found'}>
        {activities.map((activity) => (
          <TableRow
            key={activity._id}
          >
            {(columnKey) => (
              <TableCell>
                <TableCellComponent
                  activity={activity}
                  columnKey={columnKey}
                  expandedKeys={expandedKeys}
                  onToggleExpand={handleToggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
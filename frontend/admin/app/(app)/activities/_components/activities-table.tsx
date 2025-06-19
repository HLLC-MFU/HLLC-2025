import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import { Activities } from '@/types/activities';
import { columns } from './activities-table/TableColumns';
import { TableCell as TableCellComponent } from './activities-table/TableCell';
import { ExpandedDetails } from './activities-table/ExpandedDetails';

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
    <div className="w-full space-y-4 shadow-md rounded-xl overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Activities</h2>
      </div>
      <Table
        aria-label="Activities table"
        removeWrapper
        classNames={{
          th: 'bg-default-100 text-default-800 font-semibold text-xs py-3',
          td: 'py-3',
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
              className="hover:bg-default-50 transition-colors"
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

      <AnimatePresence>
        {activities
          .filter((activity) => expandedKeys.has(activity._id))
          .map((activity) => (
            <ExpandedDetails key={`details-${activity._id}`} activity={activity} />
          ))}
      </AnimatePresence>
    </div>
  );
}

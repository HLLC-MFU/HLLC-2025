'use client';

import {
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAssessmentAverages } from '@/hooks/useAssessmentAnswer';
import { useActivities } from '@/hooks/useActivities';

export default function AssessmentTable() {
  const { activities } = useActivities({ autoFetch: true });
  const [selectedActivityId, setSelectedActivityId] = useState<
    string | undefined
  >(undefined);
  const { data, error, loading } = useAssessmentAverages(selectedActivityId);

  const selectedActivityName = selectedActivityId
    ? activities.find((a) => a._id === selectedActivityId)?.name?.th ||
      'Unknown'
    : 'All Activities';

  return (
    <div className="space-y-4">
      {/* Dropdown Filter */}
      <div className="flex flex-row items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Filter by Activity:
        </label>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" endContent={<ChevronDown />}>
              {selectedActivityName}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Activity Filter"
            onAction={(key) =>
              setSelectedActivityId(key === 'all' ? undefined : String(key))
            }
          >
            <DropdownItem key="all">All Activities</DropdownItem>
            <>
              {activities.map((act) => (
                <DropdownItem key={act._id}>
                  {act.name?.th || 'Unnamed Activity'}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500">
          Error loading assessment data: {error}
        </p>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner label="Loading data..." />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500">No data found</p>
      ) : (
        <Table aria-label="Assessment Data Table" isCompact>
          <TableHeader>
            <TableColumn>No</TableColumn>
            <TableColumn>Question (TH)</TableColumn>
            <TableColumn>Question (EN)</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Average</TableColumn>
            <TableColumn>Count</TableColumn>
          </TableHeader>
          <TableBody emptyContent="ไม่มีข้อมูล">
            {data.map((item, index) => (
              <TableRow
                key={item.assessment._id}
                className="border-b-1 border-gay-400"
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.assessment.question.th}</TableCell>
                <TableCell>{item.assessment.question.en}</TableCell>
                <TableCell>{item.assessment.type}</TableCell>
                <TableCell>{item.average.toFixed(2)}</TableCell>
                <TableCell>{item.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

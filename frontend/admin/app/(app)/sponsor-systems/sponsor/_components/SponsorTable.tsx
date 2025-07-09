'use client';

import type { Sponsors } from '@/types/sponsors';
import type { SponsorType } from '@/types/sponsors';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
} from '@heroui/react';
import { useState, useMemo, useCallback } from 'react';

import { SponsorModal } from './SponsorModal';
import SponsorCellRenderer, { SponsorColumnKey } from './SponsorCellRenderer';
import BottomContent from './BottomContent';
import { TopContent } from './TopContent';

const COLUMNS = [
  { name: 'LOGO', uid: 'logo' },
  { name: 'SPONSOR NAME', uid: 'name' },
  { name: 'PRIORITY', uid: 'priority' },
  { name: 'COLORS', uid: 'colors' },
  { name: 'ACTIONS', uid: 'actions' },
];

type SponsorTableProps = {
  isModalOpen: boolean;
  modalMode: 'edit' | 'add';
  selectedSponsor?: Partial<Sponsors> | null;
  sponsorTypes: SponsorType[];
  sponsors: Sponsors[];
  type: string;
  onAdd: () => void;
  onEdit: (s: Sponsors) => void;
  onDelete: (s: Sponsors) => void;
  handleSubmit: (sponsorData: FormData) => void;
  onClose: () => void;
}

export default function SponsorTable({
  isModalOpen,
  modalMode,
  selectedSponsor,
  sponsorTypes,
  sponsors,
  type,
  onAdd,
  onEdit,
  onDelete,
  handleSubmit,
  onClose,
}: SponsorTableProps) {
  const [filterValue, setFilterValue] = useState('');
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const handleSearch = (value: string) => {
    setFilterValue(value);
    setPage(1);
  };

  const handleClear = () => {
    setFilterValue('');
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    let filteredSponsors = [...(sponsors ?? [])];
    const query = filterValue.toLowerCase();

    if (!!filterValue) {
      filteredSponsors = sponsors.filter(
        (sponsor) =>
          sponsor.name.en.toLowerCase().includes(query) ||
          sponsor.name.th.toLowerCase().includes(query) ||
          sponsor.priority.toString().toLowerCase().includes(query)
      );
    }

    return filteredSponsors;
  }, [sponsors, filterValue]);

  const sponsorItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const renderCell = useCallback(
    (sponsors: Sponsors, columnKey: SponsorColumnKey) => {
      return (
        <SponsorCellRenderer
          columnKey={columnKey}
          sponsor={sponsors}
          onDelete={() => onDelete(sponsors)}
          onEdit={() => onEdit(sponsors)}
        />
      );
    },
    [sponsors, onEdit, onDelete],
  );

  return (
    <>
      <Table

        aria-label="Sponsor Table"
        bottomContent={
          <BottomContent
            page={page}
            pages={pages}
            setPage={setPage}
          />
        }
        bottomContentPlacement="outside"
        sortDescriptor={sortDescriptor}
        topContent={
          <TopContent
            filterValue={filterValue}
            onAdd={onAdd}
            onClear={handleClear}
            onSearchChange={handleSearch}
          />
        }
        topContentPlacement="outside"
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={COLUMNS}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              className='w-1/4'
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-default-400">No sponsors found</span>
            </div>
          }
          items={[...sponsorItems].sort((a, b) => a.priority - b.priority)}
        >
          {(sponsor) => (
            <TableRow
              key={sponsor._id}
              className="hover:bg-default-50 transition-colors"
            >
              {(columnKey) => (
                <TableCell className={`${columnKey.toString()} py-4`}>
                  {renderCell(sponsor, columnKey as SponsorColumnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <SponsorModal
        allSponsors={sponsors}
        isOpen={isModalOpen}
        mode={modalMode}
        sponsor={
          selectedSponsor && '_id' in selectedSponsor
            ? (selectedSponsor as Sponsors)
            : undefined
        }
        sponsorTypes={sponsorTypes}
        type={type}
        onClose={onClose}
        onSuccess={handleSubmit}
      />
    </>
  );
}

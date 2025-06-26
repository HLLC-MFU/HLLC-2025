'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
} from '@heroui/react';
import type { Sponsors } from '@/types/sponsors';
import type { SponsorType } from '@/types/sponsors';
import { SponsorModal } from './SponsorModal';
import { useState, useMemo, useCallback } from 'react';
import SponsorCellRenderer, { SponsorColumnKey } from './SponsorCellRenderer';
import BottomContent from './BottomContent';
import { TopContent } from './TopContent';

interface SponsorTableProps {
  type: string;
  sponsorTypes: SponsorType[];
  isModalOpen: boolean;
  onClose: () => void;
  modalMode: 'edit' | 'add';
  selectedSponsor?: Sponsors | Partial<Sponsors>;
  handleSubmitSponsor: (sponsorData: FormData) => void;
  sponsors: Sponsors[];
  onEdit: (s: Sponsors) => void;
  onDelete: (s: Sponsors) => void;
  onToggleShow: (s: Sponsors) => void;
}

const COLUMNS = [
  { name: 'LOGO', uid: 'logo' },
  { name: 'SPONSOR NAME', uid: 'name', sortable: true },
  { name: 'TYPE', uid: 'type' },
  { name: 'DISPLAY', uid: 'display', sortable: true },
  { name: 'ACTIONS', uid: 'actions' },
];

export default function SponsorTable({
  sponsors,
  type,
  sponsorTypes,
  isModalOpen,
  modalMode,
  selectedSponsor,
  handleSubmitSponsor,
  onEdit,
  onDelete,
  onClose,
}: SponsorTableProps) {
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const handleSearch = (value: string) => {
    setFilterValue(value);
    setPage(1);
  };

  const handleClear = () => {
    setFilterValue('');
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    const query = filterValue.toLowerCase();
    return sponsors.filter(
      (sponsor) =>
        sponsor.photo.toLowerCase().includes(query) ||
        sponsor.name.en.toLowerCase().includes(query) ||
        sponsor.type.name.toString().includes(query) ||
        sponsor.isShow.toString().includes(query),
    );
  }, [sponsors, filterValue]);

  const sortedSponsors = useMemo(() => {
    return [...sponsors].sort((a, b) => {
      const col = sortDescriptor.column;

      const getValue = (sponsor: Sponsors) => {
        switch (col) {
          case 'name':
            return sponsor.name.en.toLowerCase();
          case 'type':
            return sponsor.type.name.toLowerCase();
          case 'display':
            return sponsor.isShow ? 1 : 0;
          default:
            return '';
        }
      };

      const firstValue = getValue(a);
      const secondValue = getValue(b);

      let comparisonResult = 0;

      if (firstValue < secondValue) {
        comparisonResult = -1;
      } else if (firstValue > secondValue) {
        comparisonResult = 1;
      }

      return sortDescriptor.direction === 'descending'
        ? -comparisonResult
        : comparisonResult;
    });
  }, [filteredItems, sortDescriptor]);

  const rowsPerPage = 5;

  const pagedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedSponsors.slice(start, start + rowsPerPage);
  }, [sortedSponsors, page]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const renderCell = useCallback(
    (sponsor: Sponsors, columnKey: SponsorColumnKey) => {
      return (
        <SponsorCellRenderer
          sponsor={sponsor}
          columnKey={columnKey}
          onEdit={() => onEdit(sponsor)}
          onDelete={() => onDelete(sponsor)}
        />
      );
    },
    [onEdit, onDelete],
  );

  // <SponsorFilters
  //   searchQuery={searchQueries[type] ?? ''}
  //   onAddSponsor={handleAddSponsor}
  //   onSearchQueryChange={(v) =>
  //     handleSearchQueryChange(type, v)
  //   }
  // />

  return (
    <>
      <Table
        aria-label="Sponsor Table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        topContentPlacement="outside"
        //         topContent={
        //           <TopContent
        // searchQuery={}
        //   onSearchQueryChange={}
        //   onAddSponsor={}
        //           />
        //         }
        bottomContentPlacement="outside"
        bottomContent={
          <BottomContent page={page} pages={pages} setPage={setPage} />
        }
      >
        <TableHeader columns={COLUMNS}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
              className="w-1/4"
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
          items={pagedItems}
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
        onSuccess={handleSubmitSponsor}
      />
    </>
  );
}

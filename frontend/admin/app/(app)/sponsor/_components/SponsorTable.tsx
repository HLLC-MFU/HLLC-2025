"use client";

import type { Sponsors } from "@/types/sponsors";
import type { SponsorType } from "@/types/sponsors";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  SortDescriptor,
} from "@heroui/react";
import { EllipsisVertical, Pen, Trash } from "lucide-react";
import { useState, useMemo } from "react";

import { SponsorModal } from "./SponsorModal";

interface SponsorTableProps {
  type: string;
  sponsorTypes: SponsorType[];
  isModalOpen: boolean;
  onClose: () => void;
  modalMode: "edit" | "add";
  selectedSponsor?: Sponsors | Partial<Sponsors>;
  handleSubmitSponsor: (sponsorData: FormData) => void;
  sponsors: Sponsors[];
  onEdit: (s: Sponsors) => void;
  onDelete: (s: Sponsors) => void;
  onToggleShow: (s: Sponsors) => void;
}

const columns = [
  { name: "Logo", uid: "logo" },
  { name: "Sponsor name", uid: "name", sortable: true },
  { name: "Type", uid: "type" },
  { name: "Display", uid: "isShow", sortable: true },
  { name: "Actions", uid: "actions" },
];

export default function SponsorTable({
  type,
  sponsorTypes,
  isModalOpen,
  onClose,
  modalMode,
  selectedSponsor,
  handleSubmitSponsor,
  sponsors,
  onEdit,
  onDelete,
}: SponsorTableProps) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const sortedSponsors = useMemo(() => {
    return [...sponsors].sort((a, b) => {
      const col = sortDescriptor.column;

      const getValue = (sponsor: Sponsors) => {
        switch (col) {
          case "name":
            return sponsor.name.en.toLowerCase();
          case "type":
            return sponsor.type.name.toLowerCase();
          case "isShow":
            return sponsor.isShow ? 1 : 0;
          default:
            return "";
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

      return sortDescriptor.direction === "descending"
        ? -comparisonResult
        : comparisonResult;

    });
  }, [sponsors, sortDescriptor]);

  return (
    <>
      <Table
        aria-label="Sponsor Table"
        className="min-w-full"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              allowsSorting={column.sortable}
              className="text-center"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody items={sortedSponsors}>
          {(sponsor) => (
            <TableRow key={sponsor._id}>
              <TableCell className="text-center">
                {sponsor.photo && typeof sponsor.photo === "string" ? (
                  <img
                    alt={sponsor.name.en}
                    className="h-16 w-16 object-contain rounded border border-default-300 bg-white mx-auto"
                    height={64}
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`}
                    width={64}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <span className="text-default-500 italic">No Logo</span>
                )}
              </TableCell>

              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-sm font-medium text-default-900">
                    {sponsor.name.en}
                  </div>
                  <div className="text-sm text-default-500">
                    {sponsor.name.th}
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center">
                {sponsor.type.name}
              </TableCell>

              <TableCell className="text-center">
                <Chip
                  color={sponsor.isShow ? "primary" : "danger"}
                  variant="solid"
                >
                  {sponsor.isShow ? "Show" : "Hide"}
                </Chip>
              </TableCell>

              <TableCell className="text-center">
                <div className="relative flex justify-center items-center gap-2">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <EllipsisVertical className="text-default-300" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="edit"
                        startContent={<Pen size={16} />}
                        onPress={() => onEdit(sponsor)}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash size={16} />}
                        onPress={() => onDelete(sponsor)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <SponsorModal
        isOpen={isModalOpen}
        mode={modalMode}
        sponsor={
          selectedSponsor && "_id" in selectedSponsor
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
import React from "react";
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
} from "@heroui/react";
import { EllipsisVertical, Pen, Pencil, Trash, Trash2 } from "lucide-react";
import type { Sponsor, Type } from "@/types/sponsor";
import { SponsorModal } from "./SponsorModal";

interface SponsorTableProps {
  type: string;
  sponsorTypes: Type[];
  isModalOpen: boolean;
  onClose: () => void;
  modalMode: "edit" | "add";
  selectedSponsor?: Sponsor | Partial<Sponsor>;
  handleSubmitSponsor: (sponsorData: Partial<Sponsor>) => void;
  sponsors: Sponsor[];
  onEdit: (s: Sponsor) => void;
  onDelete: (s: Sponsor) => void;
  onToggleShow: (s: Sponsor) => void;
}

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
  onToggleShow,
}: SponsorTableProps) {
  return (
    <>
      <Table
        aria-label="Sponsor Table"
        selectionMode="multiple"
        className="min-w-full"
      >
        <TableHeader>
          <TableColumn>logo</TableColumn>
          <TableColumn>ชื่อ Sponsor (EN)</TableColumn>
          <TableColumn>ชื่อ Sponsor (TH)</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn className="text-center">Show</TableColumn>
          <TableColumn className="text-center">Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {sponsors.map((s) => (
            <TableRow key={s._id}>
              <TableCell>
                {s.photo?.logoPhoto ? (
                  <img
                    src={`http://localhost:8080/uploads/${s.photo.logoPhoto}`}
                    alt={s.name.en}
                    className="h-10 w-10 object-contain rounded"
                  />
                ) : (
                  <span className="text-default-500 italic">No Logo</span>
                )}
              </TableCell>
              <TableCell>{s.name.en}</TableCell>
              <TableCell>{s.name.th}</TableCell>
              <TableCell>
                {typeof s.type === "object" && s.type !== null
                  ? (s.type as { name: string }).name
                  : s.type}
              </TableCell>
              <TableCell className="text-center">
                <Chip
                  color={s.isShow ? "primary" : "danger"}
                  variant="faded"
                  className="cursor-pointer select-none"
                  onClick={() => onToggleShow(s)}
                >
                  {s.isShow ? "Show" : "Hide"}
                </Chip>
              </TableCell>
              <TableCell className="text-center">
                <div className="relative flex justify-end items-center gap-2">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <EllipsisVertical className="text-default-300" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="edit"
                        startContent={<Pen size="16px" />}
                        onPress={() => onEdit(s)}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        startContent={<Trash size="16px" />}
                        className="text-danger"
                        color="danger"
                        onPress={() => onDelete(s)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SponsorModal
        type={type}
        sponsorTypes={sponsorTypes}
        isOpen={isModalOpen}
        mode={modalMode}
        sponsor={
          selectedSponsor && '_id' in selectedSponsor
            ? (selectedSponsor as Sponsor)
            : undefined
        }
        onClose={onClose}
        onSuccess={handleSubmitSponsor}
      />
    </>
  );
}
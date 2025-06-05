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
} from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import type { Sponsor } from "@/types/sponsor";

interface SponsorTableProps {
  sponsors: Sponsor[];
  onEdit: (s: Sponsor) => void;
  onDelete: (s: Sponsor) => void;
  onToggleShow: (s: Sponsor) => void;
}

export default function SponsorTable({
  sponsors,
  onEdit,
  onDelete,
  onToggleShow,
}: SponsorTableProps) {
  return (
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
              {s.name.th}
            </TableCell>
            <TableCell>{s.name.en}</TableCell>
            <TableCell>{s.name.th}</TableCell>
            <TableCell>
              {typeof s.type === "object" && s.type !== null
                ? s.type.name
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
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(s)}
                className="mr-2"
              >
                <Pencil size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                onPress={() => onDelete(s)}
              >
                <Trash2 size={16} />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
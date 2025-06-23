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
import { EllipsisVertical, Pen, Trash } from "lucide-react";
import type { Sponsors } from "@/types/sponsors";
import type { SponsorType } from "@/types/sponsors";
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
  return (
    <>
      <Table aria-label="Sponsor Table" className="min-w-full">
        <TableHeader>
          <TableColumn className="text-center">Logo</TableColumn>
          <TableColumn className="text-center">ชื่อ Sponsor (EN)</TableColumn>
          <TableColumn className="text-center">ชื่อ Sponsor (TH)</TableColumn>
          <TableColumn className="text-center">Type</TableColumn>
          <TableColumn className="text-center">Show</TableColumn>
          <TableColumn className="text-center">Actions</TableColumn>
        </TableHeader>

        <TableBody>
          {sponsors.map((sponsor) => (
            <TableRow key={sponsor._id}>
              <TableCell className="text-center">
                {sponsor.photo && typeof sponsor.photo === "string" ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`}
                    alt={sponsor.name.en}
                    className="h-16 w-16 object-contain rounded border border-default-300 bg-white mx-auto"
                    height={64}
                    width={64}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <span className="text-default-500 italic">No Logo</span>
                )}
              </TableCell>

              <TableCell className="text-center">{sponsor.name.en}</TableCell>
              <TableCell className="text-center">{sponsor.name.th}</TableCell>
              <TableCell className="text-center">
                {typeof sponsor.type === "object" && sponsor.type !== null
                  ? (sponsor.type as { name: string }).name
                  : sponsor.type}
              </TableCell>
              <TableCell className="text-center">
                <Chip
                  className="cursor-pointer select-none"
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
          ))}
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

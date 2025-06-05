import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, SortDescriptor, Image, } from "@heroui/react";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Evoucher, Sponsor } from "@/types/evoucher";
import TableContent from "./TableContent";
import AddModal from "./AddEvoucherModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherType } from "@/types/evoucher-type";
import AddToast from "../../users/_components/AddToast";
import { useEvoucher } from "@/hooks/useEvoucher";
import type { Selection } from "@react-types/shared";

export const columns = [
    { name: "SPONSOR", uid: "sponsors", sortable: true },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail", },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "TYPE", uid: "type", sortable: true },
    { name: "COVER", uid: "cover", },
    { name: "BANNER", uid: "banner", },
    { name: "THUMPNAIL", uid: "thumpnail", },
    { name: "LOGO", uid: "logo", },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = [
    "sponsors",
    "acronym",
    "detail",
    "discount",
    "expiration",
    "type",
    "cover",
];

export default function EvoucherTable({
    sponsorName,
    evouchers,
    EvoucherType,
    sponsors,
}: {
    sponsorName: string,
    evouchers: Evoucher[];
    EvoucherType: EvoucherType[];
    sponsors: Sponsor[];
}) {
    const { createEvoucher } = useEvoucher();

    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set<string>());
    const [visibleColumns, setVisibleColumns] = React.useState(
        new Set(INITIAL_VISIBLE_COLUMNS),
    );
    const [typeFilter, setTypeFilter] = React.useState<"all" | string>("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
    });
    const [page, setPage] = React.useState(1);
    const [actionText, setActionText] = React.useState<"Add" | "Edit">("Add");
    const [isAddOpen, setIsAddOpen] = React.useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredEvoucher = [...evouchers];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsors.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.type.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.discount.toString().includes(filterValue.toLowerCase()) ||
                evoucher.acronym.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.detail.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.expiration.toString().includes(filterValue.toLowerCase())
            );
        }
        if (typeFilter !== "all" && Array.from(typeFilter).length !== EvoucherType.length) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                Array.from(typeFilter).includes(evoucher.type.name),
            );
        }

        return filteredEvoucher;
    }, [evouchers, filterValue, typeFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a: Evoucher, b: Evoucher) => {
            const first = a[sortDescriptor.column as keyof Evoucher] as number;
            const second = b[sortDescriptor.column as keyof Evoucher] as number;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = React.useCallback((evoucher: Evoucher, columnKey: React.Key) => {
        const cellValue = evoucher[columnKey as keyof Evoucher];

        switch (columnKey) {
            case "sponsors":
                return (cellValue as Sponsor).name.en;
            case "discount":
                return cellValue
            case "acronym":
                return cellValue;
            case "detail":
                return (cellValue as { en: string }).en;
            case "type":
                return (cellValue as { name: string }).name
            case "expiration":
                if (typeof cellValue === "string" || cellValue instanceof Date) {
                    return new Date(cellValue).toLocaleString("en-US", {
                        dateStyle: 'long',
                        timeStyle: 'short',
                        timeZone: 'UTC'
                    });
                }
            case "cover":
                return (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo?.coverPhoto}`}
                        alt="Cover"
                        width={100}
                    />
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem key="edit" onPress={() => { setActionText("Edit"); setIsAddOpen(true); }}>Edit</DropdownItem>
                                <DropdownItem key="delete" onPress={() => setIsDeleteOpen(true)}>Delete</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue || "";
        }
    }, []);

    const handleAdd = async (evoucher: FormData) => {
        try {
            const response = await createEvoucher(evoucher);
            setIsAddOpen(false);

            AddToast({
                title: "Add Successfully",
                description: "Data has been added successfully",
            });

            if (response) window.location.reload();
        } catch (error) {
            AddToast({
                title: "Failed to Add",
                description: (error as Error)?.message || "An error occurred while adding data.",
                color: "danger",
            });
        }
    };

    const handleDelete = () => {
        setIsDeleteOpen(true);
    };

    return (
        <div>
            <TableContent
                setIsAddOpen={setIsAddOpen}
                setActionText={setActionText}
                sortDescriptor={sortDescriptor}
                setSortDescriptor={setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={sortedItems}
                renderCell={renderCell}
                filterValue={filterValue}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                EvoucherType={EvoucherType}
                capitalize={capitalize}
                visibleColumns={visibleColumns}
                setVisibleColumns={(columns: Set<string>) => setVisibleColumns(new Set(columns))}
                columns={columns}
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                filteredItems={filteredItems}
                page={page}
                pages={pages}
                setPage={setPage}
                onPreviousPage={() => setPage((page) => Math.max(1, page - 1))}
                onNextPage={() => setPage((page) => page + 1)}
                onClear={() => {
                    setFilterValue("");
                    setPage(1);
                }}
                onSearchChange={(val) => {
                    setFilterValue(val);
                    setPage(1);
                }}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setPage(1);
                }}
            />

            {/* Add evoucher modal */}
            <AddModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAdd={handleAdd}
                title={actionText}
                type={EvoucherType}
                sponsors={sponsors}
            />

            {/* Delete evoucher modal */}
            <ConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title={"Delete evoucher"}
                body={"Are you sure you want to delete this item?"}
                confirmColor='danger'
            />
        </div>
    )
};

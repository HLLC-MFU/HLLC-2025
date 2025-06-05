import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, SortDescriptor, } from "@heroui/react";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import TableContent from "./TableContent";
import AddModal from "./AddModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherType } from "@/types/evoucherType";

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
    { name: "ACTIONS", uid: "actions", },
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
    "actions",
];

export default function EvoucherTable({
    sponsorName,
    evouchers,
    EvoucherType,
}: {
    sponsorName: string,
    evouchers: Evoucher[];
    EvoucherType: EvoucherType;
}) {
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<"all" | Set<unknown>>(new Set([]));
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
        if (visibleColumns === "all") return columns;

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

        console.log(evoucher);

        switch (columnKey) {
            case "sponsors":
                return cellValue.name.en;
            case "discount":
                return cellValue
            case "acronym":
                return cellValue;
            case "detail":
                return cellValue.en;
            case "type":
                return cellValue.name;
            case "expiration":
                return new Date(cellValue).toLocaleString("en-US", {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'UTC'
                });
            case "type":
                return cellValue.name;
            case "cover":
                const imageUrl = `/images/${evoucher.photo?.coverPhoto || "default.jpg"}`;
                return (
                    <img
                        src={imageUrl}
                        alt="Cover"
                        className="w-24 h-16 object-cover rounded"
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

    const handleAdd = () => {
        setIsAddOpen(true);
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
                setVisibleColumns={setVisibleColumns}
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

import { Button, Chip, ChipProps, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, SortDescriptor, } from "@heroui/react";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import TableContent from "./TableContent";
import AddModal from "./AddModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";

export const columns = [
    { name: "SPONSOR", uid: "sponsor" },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail" },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "TYPE", uid: "type" },
    { name: "COVER", uid: "cover", },
    { name: "BANNER", uid: "banner", },
    { name: "THUMPNAIL", uid: "thumpnail", },
    { name: "LOGO", uid: "logo", },
    { name: "ACTIONS", uid: "actions", },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export const typeOptions = [
    { name: "Global" },
    { name: "Individual" },
];

const typeColorMap: Record<string, ChipProps["color"]> = {
    Global: "success",
    Individual: "warning",
};

const INITIAL_VISIBLE_COLUMNS = [
    "sponsor",
    "acronym",
    "detail",
    "discount",
    "expiration",
    "type",
    "actions"
];

export default function EvoucherTable({
    sponsorName,
    evouchers,
    setIsAddOpen,
    setIsDeleteOpen,
    setActionText,
}: {
    sponsorName: string,
    evouchers: Evoucher[];
    setIsAddOpen: (value: boolean) => void;
    setIsDeleteOpen: (value: boolean) => void;
    setActionText: (value: string) => void;
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

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredEvoucher = [...evouchers];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsor.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.type.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.discount.toString().includes(filterValue.toLowerCase()) ||
                evoucher.acronym.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.detail.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.expiration.toString().includes(filterValue.toLowerCase())
            );
        }
        if (typeFilter !== "all" && Array.from(typeFilter).length !== typeOptions.length) {
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
            case "sponsor":
                return cellValue.name.en;
            case "detail":
                return cellValue.en;
            case "type":
                return cellValue.name;
            case "expiration":
                return cellValue.toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "2-digit",
                });
            case "type":
                return (
                    <Chip color={typeColorMap[cellValue.name]} size="sm" variant="flat">
                        {cellValue.name}
                    </Chip>
                )
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
                                <DropdownItem key="edit" onPress={() => {setActionText("Edit"); setIsAddOpen(true);}}>Edit</DropdownItem>
                                <DropdownItem key="delete" onPress={() => setIsDeleteOpen(true)}>Delete</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

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
                typeOptions={typeOptions}
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
        </div>
    )
};

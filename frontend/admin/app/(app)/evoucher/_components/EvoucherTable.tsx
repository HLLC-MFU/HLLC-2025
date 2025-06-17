import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, SortDescriptor, Image, addToast, } from "@heroui/react";
import React, { Key, useCallback, useMemo, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Sponsors } from "@/types/sponsors";
import TableContent from "./TableContent";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { Evoucher } from "@/types/evoucher";
import { useEvoucher } from "@/hooks/useEvoucher";
import type { Selection } from "@react-types/shared";
import AddEvoucherModal from "./AddEvoucherModal";

export const columns = [
    { name: "SPONSOR", uid: "sponsors", sortable: true },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail" },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "STATUS", uid: "status", sortable: true },
    { name: "MAX CLAIMS", uid: "maxClaims" },
    { name: "COVER", uid: "cover" },
    { name: "ACTIONS", uid: "actions" },
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
    "status",
    "cover",
];

export default function EvoucherTable({
    sponsorName,
    evouchers,
    sponsors,
}: {
    sponsorName: string,
    evouchers: Evoucher[];
    sponsors: Sponsors[];
}) {
    const { createEvoucher } = useEvoucher();

    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set<string>());
    const [visibleColumns, setVisibleColumns] = useState(
        new Set(INITIAL_VISIBLE_COLUMNS),
    );
    const [typeFilter, setTypeFilter] = useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);
    const [actionText, setActionText] = useState<"Add" | "Edit">("Add");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = useMemo(() => {
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = useMemo(() => {
        let filteredEvoucher = [...evouchers];

        if (hasSearchFilter) {
            filteredEvoucher = filteredEvoucher.filter((evoucher) =>
                evoucher.sponsors.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.discount.toString().includes(filterValue.toLowerCase()) ||
                evoucher.acronym.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.detail.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                evoucher.expiration.toString().includes(filterValue.toLowerCase())
            );
        }

        return filteredEvoucher;
    }, [evouchers, filterValue]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = useMemo(() => {
        return [...items].sort((a: Evoucher, b: Evoucher) => {
            const first = a[sortDescriptor.column as keyof Evoucher] as number;
            const second = b[sortDescriptor.column as keyof Evoucher] as number;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = useCallback((evoucher: Evoucher, columnKey: Key) => {
        const cellValue = evoucher[columnKey as keyof Evoucher];

        switch (columnKey) {
            case "sponsors":
                return (cellValue as Evoucher['sponsors']).name.en;
            case "discount":
                return `${cellValue}%`;
            case "acronym":
                return cellValue;
            case "detail":
                return (cellValue as { en: string }).en;
            case "status":
                return cellValue as Evoucher['status'];
            case "maxClaims":
                return `${evoucher.claims.currentClaim} / ${evoucher.claims.maxClaim}`;
            case "expiration":
                if (typeof cellValue === "string") {
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
                                <DropdownItem 
                                    key="edit" 
                                    onPress={() => {
                                        setActionText("Edit");
                                        setIsModalOpen(true);
                                    }}
                                >
                                    Edit
                                </DropdownItem>
                                <DropdownItem key="delete" onPress={() => setIsDeleteOpen(true)}>
                                    Delete
                                </DropdownItem>
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
            setIsModalOpen(false);

            addToast({
                title: "Add Successfully",
                description: "Data has been added successfully",
            });

            if (response) window.location.reload();
        } catch (error) {
            addToast({
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
                setActionText={(text) => {
                    setActionText(text);
                    setIsModalOpen(true);
                }}
                sortDescriptor={sortDescriptor}
                setSortDescriptor={setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={sortedItems}
                renderCell={renderCell}
                filterValue={filterValue}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
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
            />

            {/* Add/Edit evoucher modal */}
            {isModalOpen && (
                <AddEvoucherModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAdd}
                    title={actionText}
                    sponsors={sponsors}
                    type={evouchers}
                />
            )}

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

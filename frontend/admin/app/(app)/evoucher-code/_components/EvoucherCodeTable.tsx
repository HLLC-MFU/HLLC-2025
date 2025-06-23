import React, { Key, useCallback, useEffect, useMemo, useState } from "react";
import { Sponsors } from "@/types/sponsors";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, SortDescriptor } from "@heroui/react";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherCodeModal } from "./EvoucherCodeModal";
import EvoucherCodeCellRenderer from "./EvoucherCodeCellRenderer";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";

const COLUMNS = [
    { name: "CODE", uid: "code", sortable: true },
    { name: "EVOUCHER", uid: "evoucher", sortable: true },
    { name: "SPONSOR", uid: "sponsor", sortable: true },
    { name: "USED", uid: "isUsed", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "USER", uid: "user", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = new Set([
    "code", "evoucher", "sponsor", "isUsed", "expiration", "user", "actions"
]);
const ROWS_PER_PAGE = 5;
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

export default function EvoucherCodeTable({
    evoucherCodes,
    evouchers,
    sponsorId
}: {
    evoucherCodes: EvoucherCode[];
    evouchers: Evoucher[];
    sponsors: Sponsors[];
    sponsorId: string;
}) {
    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
    const [selectedEvoucherCode, setSelectedEvoucherCode] = useState<EvoucherCode>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionText, setActionText] = useState<"Add" | "Edit">("Add");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "code", direction: "ascending" });
    const [page, setPage] = useState(1);

    const filteredItems = useMemo(() => {
        return evoucherCodes.filter((item) => {
            if (!filterValue) return true;
            return item.code?.toLowerCase().includes(filterValue.toLowerCase());
        });
    }, [filterValue, evoucherCodes]);

    const sortedItems = useMemo(() => {
        const sorted = [...filteredItems];
        const { column, direction } = sortDescriptor;
        sorted.sort((a: any, b: any) => {
            const valA = a[column as keyof EvoucherCode];
            const valB = b[column as keyof EvoucherCode];
            if (valA === undefined || valB === undefined) return 0;
            const comparison = String(valA).localeCompare(String(valB));
            return direction === "ascending" ? comparison : -comparison;
        });
        return sorted;
    }, [filteredItems, sortDescriptor]);

    const pages = Math.ceil(sortedItems.length / ROWS_PER_PAGE);
    const pagedItems = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        return sortedItems.slice(start, start + ROWS_PER_PAGE);
    }, [page, sortedItems]);

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const handleAddNew = () => {
        setActionText("Add");
        setIsModalOpen(true);
    };

    const handleEdit = () => {
        setActionText("Edit");
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedEvoucherCode) {
            console.log("🔥 DELETE:", selectedEvoucherCode._id);
            // add actual deletion logic here
        }
        setIsDeleteOpen(false);
    };

    const handleSuccess = async (formData: FormData, mode: "add" | "edit") => {
        console.log("📦 SUBMIT", mode, Object.fromEntries(formData.entries()));
        setIsModalOpen(false);
        setSelectedEvoucherCode(undefined);
    };

    const headerColumns = useMemo(
        () => COLUMNS.filter((column) => visibleColumns.has(column.uid)),
        [visibleColumns]
    );

    const renderCell = useCallback(
        (evoucherCode: EvoucherCode, columnKey: Key) => (
            <EvoucherCodeCellRenderer
                evoucherCode={evoucherCode}
                columnKey={columnKey}
                onEdit={() => {
                    setSelectedEvoucherCode(evoucherCode);
                    handleEdit();
                }}
                onDelete={() => {
                    setSelectedEvoucherCode(evoucherCode);
                    setIsDeleteOpen(true);
                }}
            />
        ),
        []
    );

    const getUniqueKey = (item: EvoucherCode, index: number) => `${item._id}-${index}`;

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Evoucher Code Table"
                topContent={
                    <TopContent
                        setActionText={handleAddNew}
                        filterValue={filterValue}
                        capitalize={capitalize}
                        visibleColumns={visibleColumns}
                        setVisibleColumns={setVisibleColumns}
                        columns={COLUMNS}
                        onClear={handleClear}
                        onSearchChange={handleSearch}
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
                        onNextPage={() => setPage((p) => Math.min(p + 1, pages))}
                    />
                }
                bottomContent={
                    <BottomContent
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
                        onNextPage={() => setPage((p) => Math.min(p + 1, pages))}
                    />
                }
                bottomContentPlacement="outside"
                topContentPlacement="outside"
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            className="py-4 bg-default-50"
                            allowsSorting={column.sortable}
                        >
                            <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent={
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="text-default-400">No evoucher codes found</span>
                        </div>
                    }
                    items={pagedItems}
                >
                    {(item: EvoucherCode) => {
                        const uniqueKey = getUniqueKey(item, pagedItems.indexOf(item));
                        return (
                            <TableRow key={uniqueKey} className="hover:bg-default-50 transition-colors">
                                {(columnKey) => (
                                    <TableCell className="py-4">
                                        {renderCell(item, columnKey)}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    }}
                </TableBody>
            </Table>

            {/* Modals */}
            {isModalOpen && (
                <EvoucherCodeModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEvoucherCode(undefined);
                    }}
                    onSuccess={handleSuccess}
                    mode={actionText.toLowerCase() as "add" | "edit"}
                    evouchers={evouchers}
                    evoucherCode={selectedEvoucherCode}
                    sponsorId={sponsorId}
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedEvoucherCode(undefined);
                }}
                onConfirm={handleDeleteConfirm}
                title={"Delete evoucher code"}
                body={"Are you sure you want to delete this item?"}
                confirmColor="danger"
            />
        </div>
    );
}

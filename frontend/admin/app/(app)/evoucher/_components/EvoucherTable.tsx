import React, { useCallback, useMemo, useState } from "react";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import EvoucherCellRenderer, { EvoucherColumnKey } from "./EvoucherCellRenderer";
import { COLUMNS, INITIAL_VISIBLE_COLUMNS, capitalize } from "./EvoucherTableConstants";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import type { Selection } from "@react-types/shared";

export type TableColumnType = {
    uid: string;
    name: string;
    sortable?: boolean;
}

type EvoucherTableProps = {
    sponsorName: string;
    evouchers: Evoucher[];
    evoucherType: EvoucherType;
    onAdd: () => void;
    onEdit: (evoucher: Evoucher) => void;
    onDelete: (evoucher: Evoucher) => void;
};

export default function EvoucherTable({
    evouchers,
    onAdd,
    onEdit,
    onDelete,
}: EvoucherTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    const [page, setPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "acronym", direction: "ascending" });

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
    const handleNextPage = () => setPage((prev) => prev + 1);

    const filteredItems = useMemo(() => {
        const query = filterValue.toLowerCase();
        return evouchers.filter((evoucher) =>
            evoucher.sponsors.name.en.toLowerCase().includes(query) ||
            evoucher.discount.toString().includes(query) ||
            evoucher.acronym.toLowerCase().includes(query) ||
            evoucher.detail.en.toLowerCase().includes(query) ||
            evoucher.expiration.toString().includes(query)
        );
    }, [evouchers, filterValue]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Evoucher] as any;
            const second = b[sortDescriptor.column as keyof Evoucher] as any;
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const rowsPerPage = 5;
    const pagedItems = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const renderCell = useCallback(
        (evoucher: Evoucher, columnKey: EvoucherColumnKey) => {
            return (
                <EvoucherCellRenderer
                    evoucher={evoucher}
                    columnKey={columnKey}
                    onEdit={() => onEdit(evoucher)}
                    onDelete={() => onDelete(evoucher)}
                />
            );
        },
        [onEdit, onDelete]
    );

    const headerColumns = useMemo(
        () => COLUMNS.filter((column) => Array.from(visibleColumns).includes(column.uid)),
        [visibleColumns]
    );

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Table header"

                topContent={
                    <TopContent
                        setActionText={onAdd}
                        filterValue={filterValue}
                        capitalize={capitalize}
                        visibleColumns={visibleColumns}
                        setVisibleColumns={(columns: Set<string>) => setVisibleColumns(new Set(columns))}
                        onClear={handleClear}
                        onSearchChange={handleSearch}
                        selectedKeys={selectedKeys}
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={handlePreviousPage}
                        onNextPage={handleNextPage}
                    />
                }
                topContentPlacement="outside"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                onSelectionChange={setSelectedKeys}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                bottomContent={
                    <BottomContent
                        selectedKeys={selectedKeys}
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={handlePreviousPage}
                        onNextPage={handleNextPage}
                    />
                }
                bottomContentPlacement="outside"
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            className={`${column.uid} py-4 bg-default-50`}
                            allowsSorting={column.sortable}
                        >
                            <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent={
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="text-default-400">No evouchers found</span>
                        </div>
                    }
                    items={pagedItems}
                >
                    {(item) => (
                        <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${columnKey.toString()} py-4`}>
                                    {renderCell(item, columnKey as EvoucherColumnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

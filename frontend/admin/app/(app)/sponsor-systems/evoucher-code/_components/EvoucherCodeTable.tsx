import React, { Key, useCallback, useEffect, useMemo, useState } from "react";
import { Sponsors } from "@/types/sponsors";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import {
    Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, SortDescriptor,
} from "@heroui/react";
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

type EvoucherCodeTableProps = {
    evoucherCode: EvoucherCode[] | null;
    onAdd: () => void;
    onEdit: (evoucherCode: EvoucherCode) => void;
    onDelete: (evoucherCode: EvoucherCode) => void;
};

export default function EvoucherCodeTable({
    evoucherCode,
    onAdd,
    onEdit,
    onDelete,
}: EvoucherCodeTableProps) {
    const [evoucherCodes, setEvoucherCodes] = useState<EvoucherCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "code",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (evoucherCode) setEvoucherCodes(evoucherCode);
    }, [evoucherCode]);

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

    const headerColumns = useMemo(
        () => COLUMNS.filter((column) => visibleColumns.has(column.uid)),
        [visibleColumns]
    );

    const renderCell = useCallback(
        (evoucherCode: EvoucherCode, columnKey: Key) => {
            return (
                <EvoucherCodeCellRenderer
                    evoucherCode={evoucherCode}
                    columnKey={columnKey}
                    onEdit={() => onEdit(evoucherCode)}
                    onDelete={() => onDelete(evoucherCode)}
                />
            );
        },
        [onEdit, onDelete]
    );

    const getUniqueKey = (item: EvoucherCode, index: number) => `${item._id}-${index}`;

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Evoucher Code Table"
                topContent={
                    <TopContent
                        setActionText={onAdd}
                        filterValue={filterValue}
                        onClear={handleClear}
                        onSearchChange={handleSearch}
                    />
                }
                bottomContent={
                    <BottomContent
                        page={page}
                        pages={pages}
                        setPage={setPage}
                    />
                }
                bottomContentPlacement="outside"
                topContentPlacement="outside"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent={
                        loading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <span className="text-default-400">Loading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <span className="text-default-400">No evoucher codes found</span>
                            </div>
                        )
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
        </div>
    );
}

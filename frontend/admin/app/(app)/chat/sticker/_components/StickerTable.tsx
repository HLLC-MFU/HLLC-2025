import React, { useCallback, useMemo, useState } from "react";
import { Sticker } from "@/types/sticker";
import StickerCellRenderer, { StickerColumnKey } from "./StickerCellRenderer";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import StickerTopContent from "./StickerTopContent";
import StickerBottomContent from "./StickerBottomContent";
import type { Selection } from "@react-types/shared";

export const STICKER_COLUMNS = [
    { name: "IMAGE", uid: "image" },
    { name: "NAME (EN)", uid: "nameEn", sortable: true },
    { name: "NAME (TH)", uid: "nameTh", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export type StickerTableColumnType = {
    uid: string;
    name: string;
    sortable?: boolean;
}

type StickerTableProps = {
    stickers: Sticker[];
    onAdd: () => void;
    onEdit: (sticker: Sticker) => void;
    onDelete: (sticker: Sticker) => void;
};

export default function StickerTable({
    stickers,
    onAdd,
    onEdit,
    onDelete,
}: StickerTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    const [page, setPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "nameEn", direction: "ascending" });
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

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
        return stickers.filter((sticker) =>
            sticker.name.en.toLowerCase().includes(query) ||
            sticker.name.th.toLowerCase().includes(query)
        );
    }, [stickers, filterValue]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Sticker] as any;
            const second = b[sortDescriptor.column as keyof Sticker] as any;
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const rowsPerPage = 8;
    const pagedItems = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const renderCell = useCallback(
        (sticker: Sticker, columnKey: StickerColumnKey) => {
            return (
                <StickerCellRenderer
                    sticker={sticker}
                    columnKey={columnKey}
                    onEdit={() => onEdit(sticker)}
                    onDelete={() => onDelete(sticker)}
                />
            );
        },
        [onEdit, onDelete]
    );

    return (
        <div className="rounded-xl shadow bg-white p-2">
            <Table
                isHeaderSticky
                aria-label="Sticker table"
                topContent={
                    <StickerTopContent
                        setActionText={onAdd}
                        filterValue={filterValue}
                        capitalize={capitalize}
                        onClear={handleClear}
                        onSearchChange={handleSearch}
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
                    <StickerBottomContent
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
                <TableHeader columns={STICKER_COLUMNS}>
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
                            <span className="text-default-400">No stickers found</span>
                        </div>
                    }
                    items={pagedItems}
                >
                    {(item) => (
                        <TableRow key={item.id || item._id} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${columnKey.toString()} py-4`}>
                                    {renderCell(item, columnKey as StickerColumnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 
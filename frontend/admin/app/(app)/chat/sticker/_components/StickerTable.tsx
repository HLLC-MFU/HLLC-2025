import React, { useCallback, useMemo, useState } from "react";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import StickerCellRenderer, { StickerColumnKey } from "./StickerCellRenderer";
import StickerTopContent from "./StickerTopContent";
import StickerBottomContent from "./StickerBottomContent";
import { Sticker } from "@/types/sticker";

export const STICKER_COLUMNS = [
    { name: "IMAGE", uid: "image" },
    { name: "NAME (EN)", uid: "nameEn", sortable: true },
    { name: "NAME (TH)", uid: "nameTh", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

type StickerTableProps = {
    stickers: Sticker[];
    onAdd: () => void;
    onEdit: (sticker: Sticker) => void;
    onDelete: (sticker: Sticker) => void;
};

export default function StickerTable({ stickers, onAdd, onEdit, onDelete }: StickerTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [page, setPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ 
        column: "nameEn", 
        direction: "ascending" 
    });
    
    const filteredItems = useMemo(() => {
        if (!filterValue) return stickers;
        const query = filterValue.toLowerCase();
        return stickers.filter(sticker =>
            sticker.name?.en?.toLowerCase().includes(query) ||
            sticker.name?.th?.toLowerCase().includes(query)
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

    const renderCell = useCallback((sticker: Sticker, columnKey: StickerColumnKey) => {
        return (
            <StickerCellRenderer
                columnKey={columnKey}
                sticker={sticker}
                onEdit={() => onEdit(sticker)}
                onDelete={() => onDelete(sticker)}
            />
        );
    }, [onEdit, onDelete]);

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    return (
        <div className="bg-white rounded-xl shadow p-2">
            <Table
                isHeaderSticky
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                topContent={
                    <StickerTopContent
                        filterValue={filterValue}
                        onSearchChange={handleSearch}
                        onClear={handleClear}
                        setActionText={onAdd}
                        capitalize={(s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""}
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={() => setPage(prev => Math.max(1, prev - 1))}
                        onNextPage={() => setPage(prev => prev + 1)}
                    />
                }
                bottomContent={
                    <StickerBottomContent
                        filteredItems={filteredItems}
                        page={page}
                        pages={pages}
                        setPage={setPage}
                        onPreviousPage={() => setPage(prev => Math.max(1, prev - 1))}
                        onNextPage={() => setPage(prev => prev + 1)}
                    />
                }
                topContentPlacement="outside"
                bottomContentPlacement="outside"
            >
                <TableHeader columns={STICKER_COLUMNS}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : column.uid === "image" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="bg-gray-50"
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent="No stickers found"
                    items={pagedItems}
                >
                    {(item) => (
                        <TableRow key={item.id || item._id}>
                            {(columnKey) => (
                                <TableCell>
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
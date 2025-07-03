import React, { Key, useCallback, useMemo, useState } from "react";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import { Evoucher } from "@/types/evoucher";
import { Sponsors } from "@/types/sponsors";
import EvoucherCellRenderer from "./EvoucherCellRenderer";

export const COLUMNS = [
    { name: "SPONSOR", uid: "sponsors", },
    { name: "NAME", uid: "name", },
    { name: "ACRONYM", uid: "acronym", },
    { name: "ORDER", uid: "order", },
    { name: "START", uid: "startAt", },
    { name: "END", uid: "endAt", },
    { name: "DETAIL", uid: "detail", },
    { name: "PHOTO", uid: "photo", },
    { name: "CODES", uid: "amount", },
    { name: "ACTIONS", uid: "actions" },
];

type EvoucherTableProps = {
    evouchers: Evoucher[];
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
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending"
    });
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const filteredItems = useMemo(() => {
        let filteredEvoucher = [...(evouchers ?? [])]
        const query = filterValue.toLowerCase();

        if (!!filterValue) {
            filteredEvoucher = evouchers.filter(
                (evoucher) =>
                    (evoucher.sponsor as Sponsors)?.name.en.toLowerCase().includes(query) ||
                    evoucher.name.en.toLowerCase().includes(query) ||
                    evoucher.name.th.toLowerCase().includes(query) ||
                    evoucher.acronym.toLowerCase().includes(query) ||
                    evoucher.order.toString().toLowerCase().includes(query)
            );
        }
        return filteredEvoucher;
    }, [evouchers, filterValue]);

    const evoucherItems = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, sortDescriptor]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const renderCell = useCallback(
        (evoucher: Evoucher, columnKey: Key) => {
            return (
                <EvoucherCellRenderer
                    evoucher={evoucher}
                    columnKey={columnKey}
                    onEdit={() => onEdit(evoucher)}
                    onDelete={() => onDelete(evoucher)}
                />
            );
        },
        [evouchers]
    );

    return (
        <Table
            isHeaderSticky
            aria-label="Evoucher Table"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            topContentPlacement="outside"
            topContent={
                <TopContent
                    filterValue={filterValue}
                    onClear={handleClear}
                    onSearchChange={handleSearch}
                    onAdd={onAdd}
                />
            }
            bottomContentPlacement="outside"
            bottomContent={
                <BottomContent
                    page={page}
                    pages={pages}
                    setPage={setPage}
                />
            }
        >
            <TableHeader columns={COLUMNS}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody
                emptyContent={
                    <div className="flex flex-col items-center justify-center py-8">
                        <span className="text-default-400">No evouchers found</span>
                    </div>
                }
                items={[...evoucherItems]}
            >
                {(evoucher: Evoucher) => (
                    <TableRow
                        key={evoucher._id}
                        className="hover:bg-default-50 transition-colors"
                    >
                        {(columnKey) => (
                            <TableCell className={`${columnKey.toString()} py-4`}>
                                {renderCell(evoucher, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

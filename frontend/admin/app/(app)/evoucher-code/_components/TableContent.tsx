import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import { EvoucherCode } from "@/types/evoucher-code";
import { SortDescriptor } from "@heroui/react";
import type { Selection } from "@react-types/shared";
import { Key } from "react";

export interface TableColumnType {
    uid: string;
    name: string;
    sortable?: boolean;
}

export interface TableContentProps {
    setActionText: (value: "Add" | "Edit") => void;
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (descriptor: SortDescriptor) => void;
    headerColumns: TableColumnType[];
    sortedItems: EvoucherCode[];
    renderCell: (evoucherCode: EvoucherCode, columnKey: Key) => any;
    filterValue: string;
    capitalize: (value: string) => string;
    visibleColumns: Set<string>;
    setVisibleColumns: (columns: Set<string>) => void;
    columns: TableColumnType[];
    selectedKeys: Selection;
    setSelectedKeys: (keys: Selection) => void;
    filteredItems: EvoucherCode[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onClear: () => void;
    onSearchChange: (value: string) => void;
}

export default function TableContent({
    setActionText,
    sortDescriptor,
    setSortDescriptor,
    headerColumns,
    setSelectedKeys,
    sortedItems,
    renderCell,
    filterValue,
    capitalize,
    visibleColumns,
    setVisibleColumns,
    columns,
    selectedKeys,
    filteredItems,
    page,
    pages,
    setPage,
    onPreviousPage,
    onNextPage,
    onClear,
    onSearchChange,
}: TableContentProps) {

    console.log('TableContent render - sortedItems:', sortedItems.map(item => ({
        id: item._id,
        code: item.code,
        user: item.user?.username
    })));

    const getColumnWidth = (columnKey: string) => {
        switch (columnKey) {
            case "sponsors":
                return "min-w-[120px]";
            case "acronym":
                return "min-w-[100px]";
            case "detail":
                return "min-w-[180px] max-w-[250px]";
            case "discount":
                return "min-w-[80px]";
            case "expiration":
                return "min-w-[180px]";
            case "status":
                return "min-w-[90px]";
            case "claims":
                return "min-w-[80px]";
            case "cover":
                return "w-[100px]";
            case "user":
                return "min-w-[180px] max-w-[250px]";
            case "actions":
                return "w-[60px]";
            default:
                return "";
        }
    };

    // Create unique keys for each row by combining _id with index
    const getUniqueKey = (item: EvoucherCode, index: number) => `${item._id}-${index}`;

    return (
        <Table
            isHeaderSticky
            aria-label="Table header"
            bottomContent={<BottomContent
                selectedKeys={selectedKeys}
                filteredItems={filteredItems}
                page={page}
                pages={pages}
                setPage={setPage}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
            />}
            bottomContentPlacement="outside"
            topContent={<TopContent
                setActionText={setActionText}
                filterValue={filterValue}
                capitalize={capitalize}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                columns={columns}
                onClear={onClear}
                onSearchChange={onSearchChange}
                selectedKeys={selectedKeys}
                filteredItems={filteredItems}
                page={page}
                pages={pages}
                setPage={setPage}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
            />}
            topContentPlacement="outside"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
        >
            <TableHeader columns={headerColumns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                        className={`${getColumnWidth(column.uid)} py-4 bg-default-50`}
                        allowsSorting={column.sortable}
                    >
                        <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody emptyContent={
                <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-default-400">No evoucher codes found</span>
                </div>
            } items={sortedItems}>
                {(item: EvoucherCode) => {
                    const uniqueKey = `${item._id}-${sortedItems.indexOf(item)}`;
                    return (
                        <TableRow key={uniqueKey} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${getColumnWidth(columnKey.toString())} py-4`}>
                                    {renderCell(item, columnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    );
                }}
            </TableBody>
        </Table>
    );
}

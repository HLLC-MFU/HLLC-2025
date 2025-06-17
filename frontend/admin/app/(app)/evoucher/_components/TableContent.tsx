import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import { Evoucher } from "@/types/evoucher";
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
    sortedItems: Evoucher[];
    renderCell: (evoucher: Evoucher, columnKey: Key) => any;
    filterValue: string;
    typeFilter: Selection;
    setTypeFilter: (value: Selection) => void;
    capitalize: (value: string) => string;
    visibleColumns: Set<string>;
    setVisibleColumns: (columns: Set<string>) => void;
    columns: TableColumnType[];
    selectedKeys: Selection;
    setSelectedKeys: (keys: Selection) => void;
    filteredItems: Evoucher[];
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
                        className={`${column.uid === "actions" ? "w-16" : "w-48"} py-4 bg-default-50`}
                        allowsSorting={column.sortable}
                    >
                        <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody emptyContent={
                <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-default-400">No evouchers found</span>
                </div>
            } items={sortedItems}>
                {(item) => (
                    <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
                        {(columnKey) => (
                            <TableCell className={`${columnKey === "actions" ? "w-16" : "w-48"} py-4`}>
                                {renderCell(item, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};
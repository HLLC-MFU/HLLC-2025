import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import { Evoucher } from "@/types/evoucher";
import { SortDescriptor } from "@heroui/react";
import { EvoucherType } from "@/types/evoucher-type";
import type { Selection } from "@react-types/shared";
import { Key } from "react";

export interface TableColumnType {
    uid: string;
    name: string;
    sortable?: boolean;
}

export interface TableContentProps {
    setIsAddOpen: (value: boolean) => void;
    setActionText: (value: "Add" | "Edit") => void;
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (descriptor: SortDescriptor) => void;
    headerColumns: TableColumnType[];
    sortedItems: Evoucher[];
    renderCell: (evoucher: Evoucher, columnKey: Key) => any;
    filterValue: string;
    typeFilter: Selection;
    setTypeFilter: (value: Selection) => void;
    EvoucherType: EvoucherType[];
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
    setIsAddOpen,
    setActionText,
    sortDescriptor,
    setSortDescriptor,
    headerColumns,
    setSelectedKeys,
    sortedItems,
    renderCell,
    filterValue,
    typeFilter,
    setTypeFilter,
    EvoucherType,
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
                setIsAddOpen={setIsAddOpen}
                setActionText={setActionText}
                filterValue={filterValue}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                EvoucherType={EvoucherType}
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
                        className="w-48"
                        allowsSorting={column.sortable}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody emptyContent={"No users found"} items={sortedItems}>
                {(item) => (
                    <TableRow key={item._id}>
                        {(columnKey) => <TableCell className="w-48">{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};
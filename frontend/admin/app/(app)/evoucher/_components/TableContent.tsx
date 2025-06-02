import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";
import { Evoucher } from "@/types/evoucher";
import { SortDescriptor } from "@heroui/react";

export interface TableColumnType {
    uid: string;
    name: string;
    sortable?: boolean;
}

export interface TableContentProps {
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (descriptor: SortDescriptor) => void;
    headerColumns: TableColumnType[];
    sortedItems: Evoucher[];
    renderCell: (evoucher: Evoucher, columnKey: React.Key) => any;
    filterValue: string;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    typeOptions: string[];
    capitalize: (value: string) => string;
    visibleColumns: Set<string>;
    setVisibleColumns: (columns: string[]) => void;
    columns: TableColumnType[];
    selectedKeys: Set<React.Key>;
    setSelectedKeys: (keys: Set<React.Key>) => void;
    filteredItems: Evoucher[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    onRowsPerPageChange: (e: any) => void;
}

export default function TableContent({
    sortDescriptor,
    setSortDescriptor,
    headerColumns,
    setSelectedKeys,
    sortedItems,
    renderCell,
    filterValue,
    typeFilter,
    setTypeFilter,
    typeOptions,
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
                filterValue={filterValue}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                typeOptions={typeOptions}
                capitalize={capitalize}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                columns={columns}
                onClear={onClear}
                onSearchChange={onSearchChange}
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
                    <TableRow key={item.acronym}>
                        {(columnKey) => <TableCell className="w-48">{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};
import BottomContent from "./BottomContent"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { User } from "@/types/user"
import TopContent from "./TopContent"
import { SetStateAction } from "react";

interface TableContentProps {
    setIsAddOpen: (value: boolean) => void;
    setIsImportOpen: (value: boolean) => void;
    setIsExportOpen: (value: boolean) => void;
    setActionText: (value: string) => void;
    filterValue: string;
    visibleColumns: Set<string>;
    columns: Array<{ uid: string; name: string; sortable?: boolean }>;
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
    selectedKeys: "all" | Set<string | number>;
    filteredItems: User[];
    pages: number;
    page: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    setSelectedKeys: (keys: "all" | Set<string>) => void;
    sortDescriptor: { column: string; direction: "ascending" | "descending" };
    setSortDescriptor: (sort: { column: string; direction: "ascending" | "descending" }) => void;
    headerColumns: Array<{ uid: string; name: string; sortable?: boolean }>;
    sortedItems: User[];
    renderCell: (item: User, columnKey: React.Key, index: number) => any;
    onRowsPerPageChange: (rowsPerPage: number) => void;
}

export default function TableContent({
    setIsAddOpen,
    setIsImportOpen,
    setIsExportOpen,
    setActionText,
    filterValue,
    visibleColumns,
    columns,
    onSearchChange,
    onClear,
    setVisibleColumns,
    capitalize,
    selectedKeys,
    filteredItems,
    pages,
    page,
    setPage,
    onPreviousPage,
    onNextPage,
    setSelectedKeys,
    sortDescriptor,
    setSortDescriptor,
    headerColumns,
    sortedItems,
    renderCell,
    onRowsPerPageChange,
}: TableContentProps) {
    return (
        <Table
            isHeaderSticky
            aria-label="Table"
            bottomContent={<BottomContent
                selectedKeys={selectedKeys}
                filteredItems={filteredItems}
                pages={pages}
                page={page}
                setPage={setPage}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
            />}
            bottomContentPlacement="outside"
            classNames={{
                wrapper: "max-h-[382px]",
            }}
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            topContent={<TopContent
                setIsAddOpen={setIsAddOpen}
                setIsImportOpen={setIsImportOpen}
                setIsExportOpen={setIsExportOpen}
                setActionText={setActionText}
                filterValue={filterValue}
                visibleColumns={visibleColumns}
                columns={columns}
                onSearchChange={onSearchChange}
                onClear={onClear}
                setVisibleColumns={setVisibleColumns}
                capitalize={capitalize}
                onRowsPerPageChange={onRowsPerPageChange}
            />}
            topContentPlacement="outside"
            onSelectionChange={setSelectedKeys}
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
            <TableBody emptyContent={"No users found"} items={sortedItems}>
                {(item: User) => {
                    const index = sortedItems.findIndex((i) => i._id === item._id)
                    return (
                        <TableRow key={item._id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey, index)}</TableCell>}
                        </TableRow>
                    )
                }}
            </TableBody>
        </Table>
    )
};
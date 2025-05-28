import BottomContent from "./BottomContent"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { User } from "@/types/user"
import TopContent from "./TopContent"
import { SetStateAction } from "react";

interface TableContentProps {
    filterValue: string;
    visibleColumns: Set<string>;
    columns: any[];
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
    setAddModalText: React.Dispatch<React.SetStateAction<"Add" | "Edit">>;
    setIsAddModalOpen: (value: boolean) => void;
    setIsImportModalOpen: (value: boolean) => void;
    setIsExportModalOpen: (value: boolean) => void;
    selectedKeys: "all" | Set<unknown>;
    filteredItems: User[];
    pages: number;
    page: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    setSelectedKeys: React.Dispatch<SetStateAction<Set<never>>>;
    setSortDescriptor: (sort: any) => void;
    headerColumns: any[];
    sortedItems: User[];
    renderCell: (item: User, columnKey: React.Key, index: number) => any;
}

export default function TableContent({
    filterValue,
    visibleColumns,
    columns,
    onSearchChange,
    onClear,
    setVisibleColumns,
    capitalize,
    setAddModalText,
    setIsAddModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    selectedKeys,
    filteredItems,
    pages,
    page,
    setPage,
    onPreviousPage,
    onNextPage,
    setSelectedKeys,
    setSortDescriptor,
    headerColumns,
    sortedItems,
    renderCell,
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
            // sortDescriptor={sortDescriptor}
            topContent={<TopContent
                filterValue={filterValue}
                visibleColumns={visibleColumns}
                columns={columns}
                onSearchChange={onSearchChange}
                onClear={onClear}
                setVisibleColumns={setVisibleColumns}
                capitalize={capitalize}
                setAddModalText={setAddModalText}
                setIsAddModalOpen={setIsAddModalOpen}
                setIsImportModalOpen={setIsImportModalOpen}
                setIsExportModalOpen={setIsExportModalOpen}
            />}
            topContentPlacement="outside"
            onSelectionChange={setSelectedKeys}
        // onSortChange={setSortDescriptor}
        >
            <TableHeader columns={headerColumns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    // allowsSorting={column.sortable}
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
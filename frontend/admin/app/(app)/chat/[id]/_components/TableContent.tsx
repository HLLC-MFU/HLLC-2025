import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, SortDescriptor } from "@heroui/react"
import { Key, ReactNode, SetStateAction } from "react"

import BottomContent from "./BottomContent"
import TopContent from "./TopContent"

import { RoomMember } from "@/types/room"

type ModalState = {
    restriction: boolean;
}

type TableContentProps = {
    setModal: (value: SetStateAction<ModalState>) => void;
    filterValue: string;
    visibleColumns: Set<string>;
    columns: Array<{ uid: string; name: string; sortable?: boolean }>;
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
    selectedKeys: "all" | Set<string | number>;
    filteredItems: RoomMember[];
    pages: number;
    page: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    setSelectedKeys: (keys: "all" | Set<string | number>) => void;
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (sortDescriptor: SortDescriptor) => void;
    headerColumns: Array<{ uid: string; name: string; sortable?: boolean }>;
    sortedItems: RoomMember[];
    renderCell: (item: RoomMember, columnKey: Key, index: number) => ReactNode;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    onPageChange?: (page: number) => void;
    emptyMessage?: string;
}

export default function TableContent({
    setModal,
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
    pagination,
    onPageChange,
    emptyMessage = "No members found",
}: TableContentProps) {
    return (
        <Table
            isHeaderSticky
            aria-label="Table"
            bottomContent={
                <BottomContent
                    filteredItems={filteredItems}
                    page={page}
                    pages={pages}
                    selectedKeys={selectedKeys}
                    setPage={setPage}
                    onNextPage={onNextPage}
                    onPreviousPage={onPreviousPage}
                    pagination={pagination}
                    onPageChange={onPageChange}
                />
            }
            bottomContentPlacement="outside"
            classNames={{
                wrapper: "max-h-[382px]",
            }}
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            topContent={
                <TopContent
                    capitalize={capitalize}
                    columns={columns}
                    filterValue={filterValue}
                    setModal={setModal}
                    setVisibleColumns={setVisibleColumns}
                    visibleColumns={visibleColumns}
                    onClear={onClear}
                    onSearchChange={onSearchChange}
                />
            }
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
            <TableBody emptyContent={emptyMessage} items={sortedItems}>
                {(item: RoomMember) => {
                    const index = sortedItems.findIndex((i) => i.user._id === item.user._id)

                    return (
                        <TableRow key={item.user._id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey, index)}</TableCell>}
                        </TableRow>
                    )
                }}
            </TableBody>
        </Table>
    )
} 
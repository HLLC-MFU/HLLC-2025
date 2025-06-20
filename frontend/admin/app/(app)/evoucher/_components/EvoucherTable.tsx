import React, { Key, useCallback, useMemo, useState } from "react";
import { Sponsors } from "@/types/sponsors";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import EvoucherCellRenderer from "./EvoucherCellRenderer";
import { useEvoucherTable } from "./EvoucherTableLogic";
import { COLUMNS, INITIAL_VISIBLE_COLUMNS, capitalize } from "./EvoucherTableConstants";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import TopContent from "./TopContent";
import BottomContent from "./BottomContent";

export type TableColumnType = {
    uid: string;
    name: string;
    sortable?: boolean;
}

export default function EvoucherTable({
    evouchers,
}: {
    sponsorName: string;
    evouchers: Evoucher[];
    evoucherType: EvoucherType;
}) {
    const tableLogic = useEvoucherTable({ evouchers });
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
    const [selectedEvoucher, setSelectedEvoucher] = useState<Evoucher | undefined>();

    const headerColumns = useMemo(
        () => COLUMNS.filter((column) => Array.from(visibleColumns).includes(column.uid)),
        [visibleColumns]
    );

    const handleDelete = () => {
        tableLogic.setIsDeleteOpen(true);
    };

    const renderCell = useCallback(
        (evoucher: Evoucher, columnKey: Key) => {
            return (
                <EvoucherCellRenderer
                    evoucher={evoucher}
                    columnKey={columnKey}
                    onEdit={() => {
                        setSelectedEvoucher(evoucher);
                        tableLogic.handleEdit();
                    }}
                    onDelete={() => {
                        setSelectedEvoucher(evoucher);
                        handleDelete();
                    }}
                />
            );
        },
        [tableLogic.handleEdit]
    );

    return (
        <div>
            <Table
                isHeaderSticky
                aria-label="Table header"
                bottomContent={
                    <BottomContent
                        selectedKeys={tableLogic.selectedKeys}
                        filteredItems={tableLogic.filteredItems}
                        page={tableLogic.page}
                        pages={tableLogic.pages}
                        setPage={tableLogic.setPage}
                        onPreviousPage={tableLogic.handlePreviousPage}
                        onNextPage={tableLogic.handleNextPage}
                    />
                }
                bottomContentPlacement="outside"
                topContent={
                    <TopContent
                        setActionText={tableLogic.handleAddNew}
                        filterValue={tableLogic.filterValue}
                        capitalize={capitalize}
                        visibleColumns={visibleColumns}
                        setVisibleColumns={(columns: Set<string>) => setVisibleColumns(new Set(columns))}
                        onClear={tableLogic.handleClear}
                        onSearchChange={tableLogic.handleSearch}
                        selectedKeys={tableLogic.selectedKeys}
                        filteredItems={tableLogic.filteredItems}
                        page={tableLogic.page}
                        pages={tableLogic.pages}
                        setPage={tableLogic.setPage}
                        onPreviousPage={tableLogic.handlePreviousPage}
                        onNextPage={tableLogic.handleNextPage}
                    />
                }
                topContentPlacement="outside"
                selectedKeys={tableLogic.selectedKeys}
                selectionMode="multiple"
                onSelectionChange={tableLogic.setSelectedKeys}
                sortDescriptor={tableLogic.sortDescriptor}
                onSortChange={tableLogic.setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            className={`${(column.uid)} py-4 bg-default-50`}
                            allowsSorting={column.sortable}
                        >
                            <span className="text-bold text-small uppercase tracking-wider">{column.name}</span>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    emptyContent={
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="text-default-400">No evouchers found</span>
                        </div>
                    }
                    items={tableLogic.pagedItems}
                >
                    {(item) => (
                        <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
                            {(columnKey) => (
                                <TableCell className={`${(columnKey.toString())} py-4`}>
                                    {renderCell(item, columnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

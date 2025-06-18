import React, { Key, useCallback, useMemo, useState } from "react";
import { Sponsors } from "@/types/sponsors";
import TableContent from "./TableContent";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import { EvoucherModal } from "./AddEvoucherModal";
import EvoucherCellRenderer from "./EvoucherCellRenderer";
import { useEvoucherTable } from "./EvoucherTableLogic";
import { COLUMNS, INITIAL_VISIBLE_COLUMNS, capitalize } from "./EvoucherTableConstants";

export default function EvoucherTable({
    evouchers,
    sponsors,
    evoucherType,
}: {
    sponsorName: string,
    evouchers: Evoucher[];
    sponsors: Sponsors[];
    evoucherType: EvoucherType;
}) {
    const tableLogic = useEvoucherTable({ evouchers });
    const [visibleColumns, setVisibleColumns] = React.useState(INITIAL_VISIBLE_COLUMNS);
    const [selectedEvoucher, setSelectedEvoucher] = useState<Evoucher | undefined>();

    // Computed values
    const headerColumns = useMemo(() => 
        COLUMNS.filter(column => Array.from(visibleColumns).includes(column.uid)), 
        [visibleColumns]
    );

    // Render cell with extracted component
    const renderCell = useCallback((evoucher: Evoucher, columnKey: Key) => {
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
    }, [tableLogic.handleEdit]);

    const handleDelete = () => {
        tableLogic.setIsDeleteOpen(true);
    };

    const handleSuccess = async (formData: FormData, mode: "add" | "edit") => {
        if (mode === "edit" && selectedEvoucher) {
            await tableLogic.handleUpdate(selectedEvoucher._id, formData);
        } else {
            await tableLogic.handleAdd(formData);
        }
        setSelectedEvoucher(undefined);
    };

    return (
        <div>
            <TableContent
                setActionText={tableLogic.handleAddNew}
                sortDescriptor={tableLogic.sortDescriptor}
                setSortDescriptor={tableLogic.setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={tableLogic.pagedItems}
                renderCell={renderCell}
                filterValue={tableLogic.filterValue}
                typeFilter={tableLogic.typeFilter}
                setTypeFilter={tableLogic.setTypeFilter}
                capitalize={capitalize}
                visibleColumns={visibleColumns}
                setVisibleColumns={(columns: Set<string>) => setVisibleColumns(new Set(columns))}
                columns={COLUMNS}
                selectedKeys={tableLogic.selectedKeys}
                setSelectedKeys={tableLogic.setSelectedKeys}
                filteredItems={tableLogic.filteredItems}
                page={tableLogic.page}
                pages={tableLogic.pages}
                setPage={tableLogic.setPage}
                onPreviousPage={tableLogic.handlePreviousPage}
                onNextPage={tableLogic.handleNextPage}
                onClear={tableLogic.handleClear}
                onSearchChange={tableLogic.handleSearch}
            />

            {/* Modals */}
            {tableLogic.isModalOpen && (
                <EvoucherModal
                    isOpen={tableLogic.isModalOpen}
                    onClose={() => {
                        tableLogic.setIsModalOpen(false);
                        setSelectedEvoucher(undefined);
                    }}
                    onSuccess={handleSuccess}
                    mode={tableLogic.actionText.toLowerCase() as "add" | "edit"}
                    evoucherType={evoucherType}
                    sponsors={sponsors}
                    evoucher={selectedEvoucher}
                />
            )}

            <ConfirmationModal
                isOpen={tableLogic.isDeleteOpen}
                onClose={() => {
                    tableLogic.setIsDeleteOpen(false);
                    setSelectedEvoucher(undefined);
                }}
                onConfirm={() => {
                    if (selectedEvoucher) {
                        tableLogic.handleDelete(selectedEvoucher._id);
                    }
                }}
                title={"Delete evoucher"}
                body={"Are you sure you want to delete this item?"}
                confirmColor='danger'
            />
        </div>
    );
}

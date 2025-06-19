import React, { Key, useCallback, useMemo, useState } from "react";
import { Sponsors } from "@/types/sponsors";
import TableContent from "./TableContent";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherCode } from "@/types/evoucher-code";
import { EvoucherCodeModal } from "./AddEvoucherCodeModal";
import EvoucherCodeCellRenderer from "./EvoucherCodeCellRenderer";
import { useEvoucherCodeTable } from "./EvoucherCodeTableLogic";
import { COLUMNS, INITIAL_VISIBLE_COLUMNS, capitalize } from "./EvoucherCodeTableConstants";
import { Evoucher } from "@/types/evoucher";

export default function EvoucherCodeTable({
    evoucherCodes,
    evouchers,
    sponsorId,
}: {
    evoucherCodes: EvoucherCode[];
    sponsors: Sponsors[];
    evouchers: Evoucher[];
    sponsorId: string;
}) {
    const tableLogic = useEvoucherCodeTable({ evoucherCodes });
    const [visibleColumns, setVisibleColumns] = React.useState(INITIAL_VISIBLE_COLUMNS);
    const [selectedEvoucherCode, setSelectedEvoucherCode] = useState<EvoucherCode>();
    const headerColumns = useMemo(() => 
        COLUMNS.filter(column => Array.from(visibleColumns).includes(column.uid)), 
        [visibleColumns]
    );

    const renderCell = useCallback((evoucherCode: EvoucherCode, columnKey: Key) => {
        return (
            <EvoucherCodeCellRenderer
                evoucherCode={evoucherCode}
                columnKey={columnKey}
                onEdit={() => {
                    setSelectedEvoucherCode(evoucherCode);
                    tableLogic.handleEdit();
                }}
                onDelete={() => {
                    setSelectedEvoucherCode(evoucherCode);
                    handleDelete();
                }}
            />
        );
    }, [tableLogic.handleEdit]);

    const handleDelete = () => {
        tableLogic.setIsDeleteOpen(true);
    };

    const handleSuccess = async (formData: FormData, mode: "add" | "edit") => {
        try {
            if (mode === "edit" && selectedEvoucherCode) {
                await tableLogic.handleUpdate(selectedEvoucherCode._id, formData);
            } else {
                await tableLogic.handleAdd(formData);
            }
        } catch (error) {
            console.error('Error handling evoucher code operation:', error);
            throw error;
        }
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
                <EvoucherCodeModal
                    isOpen={tableLogic.isModalOpen}
                    onClose={() => {
                        tableLogic.setIsModalOpen(false);
                        setSelectedEvoucherCode(undefined);
                    }}
                    onSuccess={handleSuccess}
                    mode={tableLogic.actionText.toLowerCase() as "add" | "edit"}
                    evouchers={evouchers}
                    evoucherCode={selectedEvoucherCode}
                    sponsorId={sponsorId}
                />
            )}

            <ConfirmationModal
                isOpen={tableLogic.isDeleteOpen}
                onClose={() => {
                    tableLogic.setIsDeleteOpen(false);
                    setSelectedEvoucherCode(undefined);
                }}
                onConfirm={() => {
                    if (selectedEvoucherCode) {
                        tableLogic.handleDelete(selectedEvoucherCode._id);
                    }
                }}
                title={"Delete evoucher code"}
                body={"Are you sure you want to delete this item?"}
                confirmColor='danger'
            />
        </div>
    );
}

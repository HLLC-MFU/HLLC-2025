import React from 'react'
import { addToast, Button, Form, getKeyValue, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { columns, UserProps } from '../admin/page';

export interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: UserProps[];
    startIndex: number;
    endIndex: number;
}

export default function DeleteModal({ isOpen, onClose, data, startIndex, endIndex }: DeleteModalProps) {

    const tableData = data.slice(startIndex, endIndex)

    const [page, setPage] = React.useState(1);
    const rowsPerPage = 6;

    const pages = Math.ceil(tableData.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return tableData.slice(start, end);
    }, [page, tableData]);

    const renderCell = React.useCallback((item: any, columnKey: React.Key) => {
        const value = item[columnKey as keyof typeof item];
        return value as React.ReactNode;
    }, [tableData]);

    const handleDelete = () => {
        addToast({
            title: "Delete Successful",
            description: "Data has been deleted successfully",
            color: "success",
            variant: "solid",
            classNames: {
                base: "text-white",
                title: "text-white",
                description: "text-white",
            },
        });
        onClose();
    };

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            onClose={onClose}
            className="w-full max-w-4xl"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Delete</ModalHeader>
                <ModalBody>
                    <Table
                        aria-label="Preview table"
                        bottomContent={
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                                className="flex w-full justify-center"
                            />
                        }
                    >
                        <TableHeader>
                            {columns.map((column) => (
                                <TableColumn key={column.uid}>{column.name}</TableColumn>
                            ))}
                        </TableHeader>
                        <TableBody items={items}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ModalBody>
                <ModalFooter>
                    <Button color="default" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={handleDelete}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
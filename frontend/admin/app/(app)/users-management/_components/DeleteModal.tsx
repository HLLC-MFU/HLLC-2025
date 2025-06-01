import React from 'react'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { columns } from '../admin/page';
import { User } from '@/types/user';

export interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: User[];
    userIndex: number;
    selectedKeys: React.Key[];
    onDeleteUser: () => void
}

export default function DeleteModal({ isOpen, onClose, data, userIndex, selectedKeys, onDeleteUser }: DeleteModalProps) {

    const selectedRows = [...selectedKeys].length > 0 ? data.filter((row) => [...selectedKeys].includes(row._id)) : [data[userIndex]].filter(Boolean);

    const [page, setPage] = React.useState(1);
    const rowsPerPage = 6;

    const pages = Math.ceil(selectedRows.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return selectedRows.slice(start, end);
    }, [page, selectedRows]);

    const renderCell = React.useCallback((item: any, columnKey: React.Key) => {
        const cellValue = item[columnKey as keyof typeof item];

        switch (columnKey) {
            case "name":
                return `${item.name.first} ${item.name.middle === null ? "" : item.name.middle} ${item.name.last}`;
            case "school":
                return item.metadata?.school?.name?.en ?? null;
            case "major":
                return item.metadata?.major?.name?.en ?? null;
            case "actions":
                return null;
            default:
                if (typeof cellValue === "object" && cellValue !== null) {
                    return JSON.stringify(cellValue);
                }
                return cellValue as React.ReactNode;
        }
    }, [selectedRows]);

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
                            {columns.filter((col) => col.uid !== "actions").map((column) => (
                                <TableColumn key={column.uid}>{column.name}</TableColumn>
                            ))}
                        </TableHeader>
                        <TableBody items={items}>
                            {(item) => (
                                <TableRow key={item._id}>
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
                    <Button color="danger" onPress={onDeleteUser}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
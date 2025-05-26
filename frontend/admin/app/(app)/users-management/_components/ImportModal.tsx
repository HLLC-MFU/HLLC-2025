// Problem: Table still rely on columns [:12]
// Solution: Get value from file 

import { addToast, Button, Form, getKeyValue, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import React from "react";
import * as XLSX from "xlsx";

export interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const columns = [
    { name: "STUDENT ID", key: "Student ID" },
    { name: "FIRST NAME", key: "First Name" },
    { name: "MIDDLE NAME", key: "Middle Name" },
    { name: "LAST NAME", key: "Last Name" },
    { name: "SCHOOL", key: "School" },
    { name: "MAJOR", key: "Major" },
]

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [fileData, setFileData] = React.useState<any[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);

    const [page, setPage] = React.useState(1);
    const rowsPerPage = 6;

    const pages = Math.ceil(fileData.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return fileData.slice(start, end);
    }, [page, fileData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setFileData(jsonData);

            const hasInvalidData = jsonData.some((item: any) => {
                const studentId = getKeyValue(item, "Student ID");
                const firstName = getKeyValue(item, "First Name");
                const lastName = getKeyValue(item, "Last Name");
                const school = getKeyValue(item, "School");
                const major = getKeyValue(item, "Major");

                return !studentId || !firstName || !lastName || !school || !major
            })
            if (hasInvalidData) {
                handleInvalidFile();
                return;
            }

            console.log(jsonData);
        };

        reader.readAsArrayBuffer(file);
    };

    const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsPreviewModalOpen(true);
        setIsImportModalOpen(false);
        onClose();
    };

    const handleInvalidFile = () => {
        setIsImportModalOpen(false);
        addToast({
            title: "Invalid File",
            description: "Please ensure the file contains valid data",
            color: "danger",
            variant: "solid",
        });
        onClose();
    };

    const handleCancel = () => {
        setIsPreviewModalOpen(false);
        setIsImportModalOpen(true);
    };

    const handleConfirmImport = () => {
        setIsPreviewModalOpen(false);
        addToast({
            title: "Import Successful",
            description: "File has been imported successfully",
            color: "success",
            variant: "solid",
            classNames: {
                base: "text-white",
                title: "text-white",
                description: "text-white",
            },
        });
    };

    const renderCell = React.useCallback((item: any, columnKey: React.Key) => {
        const value = item[columnKey as keyof typeof item];
        return value as React.ReactNode;
    }, [fileData]);

    return (
        <>
            {/* Import Modal */}
            <Modal
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                isOpen={isOpen || isImportModalOpen}
                onClose={() => { onClose(); setIsImportModalOpen(false); }}
            >
                <ModalContent>
                    <Form onSubmit={(e) => handleNext(e)} className="w-full">
                        <ModalHeader className="flex flex-col gap-1">Import file</ModalHeader>
                        <ModalBody className="w-full">
                            <Input isRequired onChange={handleFileChange} label="File" type="file" accept=".xlsx" errorMessage={"Please select file"} />
                        </ModalBody>
                        <ModalFooter className="w-full">
                            <Button color="danger" variant="light" onPress={() => { onClose(); setIsImportModalOpen(false); }}>
                                Cancel
                            </Button>
                            <Button color="primary" type="submit">
                                Next
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalContent>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                isOpen={isPreviewModalOpen}
                onClose={handleCancel}
                className="w-full max-w-4xl"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Preview table</ModalHeader>
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
                            classNames={{
                                wrapper: "min-h-[222px]",
                            }}
                        >
                            <TableHeader>
                                {columns.map((column) => (
                                    <TableColumn key={column.key}>{column.name}</TableColumn>
                                ))}
                            </TableHeader>
                            <TableBody items={items}>
                                {(item) => (
                                    <TableRow key={item}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={handleCancel}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleConfirmImport}>
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
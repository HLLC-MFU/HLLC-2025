import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import React, { ChangeEvent, FormEvent, Key, useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { columns } from "./UserTable";
import { User } from "@/types/user";
import { Major } from "@/types/major";


type ImportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onImport: (userData: Partial<User>[]) => void;
    onExportTemplate: () => void;
    roleId: string;
    majors: Major[];
}

type JsonData = {
    role: string;
    major: string;
    username: string;
    first: string;
    middle?: string;
    last: string;
}

type UserForm = {
    name: {
        first: string,
        middle: string,
        last: string,
    },
    username: string,
    role: string,
    metadata: {
        major: string
    }
}

export default function ImportModal({ isOpen, onClose, onImport, onExportTemplate, roleId, majors }: ImportModalProps) {
    const [field, setField] = useState<User[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const [page, setPage] = useState(1);
    const rowsPerPage = 6;

    const pages = Math.ceil(field.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return field.slice(start, end);
    }, [page, field]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as JsonData[];

            const formData = jsonData.map((item: JsonData) => {
                const major = majors.find(m => m.name.en === item.major);
                const mapData: User = {
                    name: {
                        first: item["first"],
                        middle: item["middle"] ?? "",
                        last: item["last"],
                    },
                    username: item["username"],
                    role: roleId,
                    metadata: {
                        major: major?._id ?? ""
                    }
                };

                return mapData;
            });

            setField(formData);
        };

        reader.readAsArrayBuffer(file);
    }

    const handleNext = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsPreviewModalOpen(true);
        setIsImportModalOpen(false);
        onClose();
    };

    const handleCancel = () => {
        setIsPreviewModalOpen(false);
        setIsImportModalOpen(true);
    };

    const handleImport = () => {
        onImport(field);
        setIsPreviewModalOpen(false);
    };

    const renderCell = useCallback((item: User, columnKey: Key) => {
        const cellValue = item[columnKey as keyof typeof item];
        const major = majors.find((m) => m._id === String(item.metadata?.major));
        switch (columnKey) {
            case "name":
                if (typeof cellValue === "object" && cellValue !== null && 'first' in cellValue) {
                    return `${cellValue.first} ${cellValue.middle ?? ""} ${cellValue.last ?? ""}`;
                }
            case "school":
                return major?.school.name.en ?? "-";
            case "major":
                return major?.name.en ?? "-";
            case "actions":
                return null;
        }
    }, [field]);

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
                    <Form className="w-full" onSubmit={(e) => handleNext(e)}>
                        <ModalHeader className="flex flex-col gap-1">Import file</ModalHeader>
                        <ModalBody className="w-full">
                            <Input isRequired accept=".xlsx" errorMessage={"Please select file"} label="File" type="file" onChange={handleFileChange} />
                            <Button color="primary" onPress={onExportTemplate}>Download template</Button>
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
                className="w-full max-w-4xl"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                isOpen={isPreviewModalOpen}
                onClose={handleCancel}
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
                                    className="flex w-full justify-center"
                                    color="primary"
                                    page={page}
                                    total={pages}
                                    onChange={(page) => setPage(page)}
                                />
                            }
                            classNames={{
                                wrapper: "min-h-[222px]",
                            }}
                        >
                            <TableHeader>
                                {columns.filter((col) => col.uid !== 'actions').map((column) => (
                                    <TableColumn key={column.uid}>{column.name}</TableColumn>
                                ))}
                            </TableHeader>
                            <TableBody items={items}>
                                {(item) => (
                                    <TableRow key={item.username}>
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
                        <Button color="primary" onPress={handleImport}>
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

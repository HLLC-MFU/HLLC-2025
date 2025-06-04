import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import React from "react";
import * as XLSX from "xlsx";
import { columns } from "./user-table";
import { User } from "@/types/user";
import { School } from "@/types/school";

export interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (userData: Partial<User>[]) => void;
    onExportTemplate: () => void;
    roleId: string;
    schools: School[];
}

interface JsonData {
    role: string;
    major: string;
    type: string;
    username: string;
    first: string;
    middle?: string;
    last: string;
}

export default function ImportModal({ isOpen, onClose, onImport, onExportTemplate, roleId, schools }: ImportModalProps) {
    const [fileData, setFileData] = React.useState<User[]>([]);
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
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as JsonData[];

            const dataForm = jsonData.map((item: JsonData) => {
                const data: JsonData = {};
                for (const key in item) {
                    try {
                        data[key] = JSON.parse(item[key]);
                    } catch (error) {
                        data[key] = item[key];
                    };
                };

                let majorId = "";
                schools.map((s) => {
                    if (s.name.en === data.school_en) {
                        s.majors.map((m) => {
                            if (m.name.en === data.major_en && m._id) majorId = m._id;
                        })
                    }
                })

                const mapData: Partial<User> = {
                    name: {
                        first: item["first"],
                        middle: item["middle"],
                        last: item["last"],
                    },
                    username: item["username"],
                    role: roleId,
                    metadata: {
                        major: majorId
                    }
                };

                console.log(mapData);
                return mapData;
            });

            setFileData(dataForm);
        };

        reader.readAsArrayBuffer(file);
    }

    const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
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
        onImport(fileData);
        setIsPreviewModalOpen(false);
    };

    const renderCell = React.useCallback((item: User, columnKey: React.Key) => {
        const cellValue = item[columnKey as keyof typeof item];
        const school = schools.map((s) => {
            // if (s === )
        }); 

        console.log(jsonDa)

        switch (columnKey) {
            case "name":
                return `${cellValue.first} ${cellValue.middle ?? ""} ${cellValue.last}`;
            // case "school":
            //     return item.metadata?.major?.school.name.en ?? null;
            // case "major":
            //     return item.metadata?.major?.name.en ?? null;
            case "actions":
                return null;
            default:
                return cellValue;
        }

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

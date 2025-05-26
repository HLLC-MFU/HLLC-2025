import React from "react"
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import * as XLSX from 'xlsx'
import { saveAs } from "file-saver";
import { UserProps } from "../admin/page";

export interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: UserProps[];
}

export default function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
    const fileNameRef = React.useRef<HTMLInputElement>(null);

    const exportFile = (data: any[], fileName = "data") => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: 'array' })
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
        saveAs(blob, `${fileName}.xlsx`);
    };

    const handleExport = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        exportFile(data, fileNameRef.current?.value || "Data");
        onClose();
    };

    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalContent>
                <Form
                    className="w-full"
                    onSubmit={(e) => handleExport(e)}
                >
                    <ModalHeader className="flex flex-col gap-1">Export File</ModalHeader>
                    <ModalBody className="w-full">
                        <Input
                            type="text"
                            label="File Name"
                            placeholder="Enter file name"
                            ref={fileNameRef}
                        />
                    </ModalBody>
                    <ModalFooter className="w-full">
                        <Button color="danger" variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            Confirm
                        </Button>
                    </ModalFooter>
                </Form>
            </ModalContent>
        </Modal>
    );
};
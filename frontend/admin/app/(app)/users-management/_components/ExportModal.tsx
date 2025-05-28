import React from "react"
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import * as XLSX from 'xlsx'
import { saveAs } from "file-saver";
import { User } from "@/types/user";

export interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: User[];
}

export default function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
    const fileNameRef = React.useRef<HTMLInputElement>(null);

    const exportFile = (data: User[], fileName = "data") => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: 'array' })
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
        saveAs(blob, `${fileName}.xlsx`);
    };

    const handleExport = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const transformedData = data.map((item) => (console.log(item), {
            username: item.username,
            first: item.name.first,
            middle: item.name.middle ?? "",
            last: item.name.last,
            role: item.role,
            school_en: item.metadata?.school?.name?.en ?? "",
            school_th: item.metadata?.school?.name?.th ?? "",
            major_en: item.metadata?.major?.name?.en ?? "",
            major_th: item.metadata?.major?.name?.th ?? "",
        }));

        exportFile(transformedData, fileNameRef.current?.value || "Data");
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
                            type="string"
                            label="File Name"
                            placeholder={fileNameRef.current?.value || "Data"}
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
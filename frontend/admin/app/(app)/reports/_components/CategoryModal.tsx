import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from "@heroui/react";
import { useState, useEffect } from "react";
import type { Category } from "@/types/report";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (category: Category) => void;
    category?: Category;
    mode: "add" | "edit";
}

export function CategoryModal({ isOpen, onClose, onSubmit, category, mode }: CategoryModalProps) {
    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [color, setColor] = useState("#000000");

    useEffect(() => {
        if (category) {
            setNameEn(category.name.en);
            setNameTh(category.name.th);
            setDescriptionEn(category.description.en);
            setDescriptionTh(category.description.th);
            setColor(category.color);
        } else {
            setNameEn("");
            setNameTh("");
            setDescriptionEn("");
            setDescriptionTh("");
            setColor("#000000");
        }
    }, [category]);

    const handleSubmit = () => {
        if (!nameEn.trim() || !nameTh.trim()) return;

        const newCategory: Category = {
            id: category?.id || `category-${Date.now()}`,
            name: {
                en: nameEn.trim(),
                th: nameTh.trim()
            },
            description: {
                en: descriptionEn.trim(),
                th: descriptionTh.trim()
            },
            color,
            createdAt: category?.createdAt || new Date(),
            updatedAt: new Date()
        };

        onSubmit(newCategory);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    {mode === "add" ? "Add New Category" : "Edit Category"}
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Category Name (English)"
                                placeholder="Enter category name in English"
                                value={nameEn}
                                onValueChange={setNameEn}
                            />
                            <Input
                                label="Category Name (Thai)"
                                placeholder="Enter category name in Thai"
                                value={nameTh}
                                onValueChange={setNameTh}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Textarea
                                label="Description (English)"
                                placeholder="Enter description in English"
                                value={descriptionEn}
                                onValueChange={setDescriptionEn}
                                minRows={3}
                            />
                            <Textarea
                                label="Description (Thai)"
                                placeholder="Enter description in Thai"
                                value={descriptionTh}
                                onValueChange={setDescriptionTh}
                                minRows={3}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Category Color:</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSubmit}>
                        {mode === "add" ? "Add" : "Save"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 
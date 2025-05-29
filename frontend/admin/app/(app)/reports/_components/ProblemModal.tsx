import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from "@heroui/react";
import { useState, useEffect } from "react";
import type { Problem, Category } from "@/types/report";

interface ProblemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (problem: Problem) => void;
    problem?: Problem;
    categories: Category[];
    mode: "add" | "edit";
}

export function ProblemModal({ isOpen, onClose, onSubmit, problem, categories, mode }: ProblemModalProps) {
    const [titleEn, setTitleEn] = useState("");
    const [titleTh, setTitleTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState<Problem["status"]>("Pending");

    useEffect(() => {
        if (problem) {
            setTitleEn(problem.title.en);
            setTitleTh(problem.title.th);
            setDescriptionEn(problem.description.en);
            setDescriptionTh(problem.description.th);
            setCategoryId(problem.categoryId);
            setStatus(problem.status);
        } else {
            setTitleEn("");
            setTitleTh("");
            setDescriptionEn("");
            setDescriptionTh("");
            setCategoryId(categories[0]?.id || "");
            setStatus("Pending");
        }
    }, [problem, categories]);

    const handleSubmit = () => {
        if (!titleEn.trim() || !titleTh.trim() || !categoryId) return;

        const newProblem: Problem = {
            id: problem?.id || `problem-${Date.now()}`,
            title: {
                en: titleEn.trim(),
                th: titleTh.trim()
            },
            description: {
                en: descriptionEn.trim(),
                th: descriptionTh.trim()
            },
            categoryId,
            status,
            createdAt: problem?.createdAt || new Date(),
            updatedAt: new Date()
        };

        onSubmit(newProblem);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    {mode === "add" ? "Add New Problem" : "Edit Problem"}
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Problem Title (English)"
                                placeholder="Enter problem title in English"
                                value={titleEn}
                                onValueChange={setTitleEn}
                            />
                            <Input
                                label="Problem Title (Thai)"
                                placeholder="Enter problem title in Thai"
                                value={titleTh}
                                onValueChange={setTitleTh}
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Select
                                label="Category"
                                selectedKeys={[categoryId]}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                {categories.map((category) => (
                                    <SelectItem key={category.id}>
                                        {category.name.en}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Status"
                                selectedKeys={[status]}
                                onChange={(e) => setStatus(e.target.value as Problem["status"])}
                            >
                                <SelectItem key="Pending">Pending</SelectItem>
                                <SelectItem key="In-Progress">In-Progress</SelectItem>
                                <SelectItem key="Done">Done</SelectItem>
                            </Select>
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
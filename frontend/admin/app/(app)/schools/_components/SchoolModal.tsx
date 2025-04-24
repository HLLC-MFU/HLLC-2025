import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";
import type { School } from "@/types/school";

interface SchoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (school: Partial<School>) => void;
    school?: School;
    mode: "add" | "edit";
}

interface FormData {
    name: {
        en: string;
        th: string;
    };
    acronym: string;
    detail: {
        en: string;
        th: string;
    };
}

export function SchoolModal({ isOpen, onClose, onSubmit, school, mode }: SchoolModalProps) {
    const [formData, setFormData] = useState<FormData>({
        name: {
            en: "",
            th: ""
        },
        acronym: "",
        detail: {
            en: "",
            th: ""
        }
    });

    // Update form data when school prop changes
    useEffect(() => {
        if (school) {
            setFormData({
                name: {
                    en: school.name?.en || "",
                    th: school.name?.th || ""
                },
                acronym: school.acronym || "",
                detail: {
                    en: school.detail?.en || "",
                    th: school.detail?.th || ""
                }
            });
        } else {
            // Reset form when adding new school
            setFormData({
                name: {
                    en: "",
                    th: ""
                },
                acronym: "",
                detail: {
                    en: "",
                    th: ""
                }
            });
        }
    }, [school]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} scrollBehavior="outside" onClose={onClose}>
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === "add" ? "Add New School" : "Edit School"}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">English Name</label>
                                <Input
                                    value={formData.name.en}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        name: { ...prev.name, en: e.target.value }
                                    }))}
                                    placeholder="Enter school name in English"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Thai Name</label>
                                <Input
                                    value={formData.name.th}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        name: { ...prev.name, th: e.target.value }
                                    }))}
                                    placeholder="Enter school name in Thai"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Acronym</label>
                                <Input
                                    value={formData.acronym}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        acronym: e.target.value
                                    }))}
                                    placeholder="Enter school acronym"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">English Description</label>
                                <Textarea
                                    value={formData.detail.en}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        detail: { ...prev.detail, en: e.target.value }
                                    }))}
                                    placeholder="Enter school description in English"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Thai Description</label>
                                <Textarea
                                    value={formData.detail.th}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        detail: { ...prev.detail, th: e.target.value }
                                    }))}
                                    placeholder="Enter school description in Thai"
                                    required
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            {mode === "add" ? "Add School" : "Save Changes"}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 
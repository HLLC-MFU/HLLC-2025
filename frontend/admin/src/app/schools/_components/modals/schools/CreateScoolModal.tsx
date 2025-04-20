"use client";

import { useState } from "react";
import { Input, Textarea, Button, Chip } from "@heroui/react";
import BlurModal from "@/components/Modals/BlurModal";
import { Schools } from "@/types/schools";
import { BuildingLibraryIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

interface CreateSchoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (schoolData: Omit<Schools, "id" | "createdAt">) => void;
}

export default function CreateSchoolModal({
    isOpen,
    onClose,
    onCreate,
}: CreateSchoolModalProps) {
    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");
    const [details, setDetails] = useState("");

    const handleSubmit = () => {
        const newSchool = {
            name,
            acronym,
            details,
            majors: []
        };
        onCreate(newSchool);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setName("");
        setAcronym("");
        setDetails("");
    };

    return (
        <BlurModal
            isOpen={isOpen}
            onClose={() => {
                handleReset();
                onClose();
            }}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary-50 dark:bg-primary-900">
                        <PlusCircleIcon className="w-6 h-6 text-primary-500" />
                    </div>
                    <h2 className="text-xl font-bold">Create New School</h2>
                </div>
            }
            footer={
                <div className="flex justify-end gap-2">
                    <Button 
                        color="danger" 
                        variant="light" 
                        onPress={() => {
                            handleReset();
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSubmit} 
                        isDisabled={!name.trim()}
                        startContent={<BuildingLibraryIcon className="w-4 h-4" />}
                    >
                        Create School
                    </Button>
                </div>
            }
        >
            <form className="space-y-5">
                <div className="space-y-1">
                    <Input
                        label="School Name"
                        placeholder="Enter school name"
                        value={name}
                        onValueChange={setName}
                        variant="bordered"
                        color="primary"
                        isRequired
                        labelPlacement="outside"
                        startContent={
                            <BuildingLibraryIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        }
                    />
                    <p className="text-xs text-gray-500">
                        The full name of the school or faculty
                    </p>
                </div>

                <div className="space-y-1">
                    <Input
                        label="Acronym"
                        placeholder="e.g., IT, ADT"
                        value={acronym}
                        onValueChange={setAcronym}
                        variant="bordered"
                        color="primary"
                        labelPlacement="outside"
                        startContent={
                            <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">[</span>
                            </div>
                        }
                        endContent={
                            <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">]</span>
                            </div>
                        }
                    />
                    <p className="text-xs text-gray-500">
                        A short abbreviation for the school
                    </p>
                </div>

                <div className="space-y-1">
                    <Textarea
                        label="Details"
                        placeholder="Enter school description"
                        value={details}
                        onValueChange={setDetails}
                        minRows={3}
                        variant="bordered"
                        color="primary"
                        labelPlacement="outside"
                    />
                    <p className="text-xs text-gray-500">
                        A detailed description of the school, its mission, and other relevant information
                    </p>
                </div>

                {acronym && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <div className="flex items-center gap-2">
                            <Chip variant="flat" color="primary" className="font-mono">
                                {acronym}
                            </Chip>
                            <span className="font-medium">{name || "School Name"}</span>
                        </div>
                    </div>
                )}
            </form>
        </BlurModal>
    );
}

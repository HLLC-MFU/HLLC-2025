"use client";

import { useEffect, useState, useMemo } from "react";
import type { School } from "@/types/school";
import mockSchools from "@/public/mock/schools.json";
import { SchoolList } from "./_components/SchoolList";
import { SchoolFilters } from "./_components/SchoolFilters";
import { SchoolModal } from "./_components/SchoolModal";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>();
    const [sortBy, setSortBy] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | undefined>();
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");

    useEffect(() => {
        const fetchSchools = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSchools(mockSchools);
        };
        fetchSchools();
    }, []);

    const sortedSchools = useMemo(() => {
        if (!schools) return [];
        return [...schools].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name":
                    comparison = a.name.en.localeCompare(b.name.en);
                    break;
                case "acronym":
                    comparison = a.acronym.localeCompare(b.acronym);
                    break;
                case "majors":
                    comparison = a.majors.length - b.majors.length;
                    break;
                default:
                    comparison = 0;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [schools, sortBy, sortDirection]);

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    };

    const handleAddSchool = () => {
        setModalMode("add");
        setSelectedSchool(undefined);
        setIsModalOpen(true);
    };

    const handleEditSchool = (school: School) => {
        setModalMode("edit");
        setSelectedSchool(school);
        setIsModalOpen(true);
    };

    const handleDeleteSchool = (school: School) => {
        setSelectedSchool(school);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedSchool) {
            setSchools(prev => prev?.filter(school => school.id !== selectedSchool.id));
            setIsDeleteModalOpen(false);
            setSelectedSchool(undefined);
        }
    };

    const handleSubmitSchool = (schoolData: Partial<School>) => {
        if (modalMode === "add") {
            // Generate a temporary ID for the new school
            const newSchool: School = {
                ...schoolData as School,
                id: `temp-${Date.now()}`,
                majors: []
            };
            setSchools(prev => [...(prev || []), newSchool]);
        } else {
            setSchools(prev => prev?.map(school =>
                school.id === selectedSchool?.id
                    ? { ...school, ...schoolData }
                    : school
            ));
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Schools & Majors Management</h1>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <SchoolFilters
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            onSortByChange={setSortBy}
                            onSortDirectionToggle={toggleSortDirection}
                            onAddSchool={handleAddSchool}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-default-400 text-sm">Total {schools?.length} schools</span>
                        </div>
                    </div>

                    <SchoolList
                        schools={sortedSchools}
                        isLoading={!schools}
                        onEditSchool={handleEditSchool}
                        onDeleteSchool={handleDeleteSchool}
                    />
                </div>
            </div>

            <SchoolModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitSchool}
                school={selectedSchool}
                mode={modalMode}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                school={selectedSchool}
            />
        </div>
    );
}
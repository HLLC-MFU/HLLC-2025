"use client";
import { useMemo, useState } from "react";
import { SchoolList } from "./_components/SchoolList";
import { SchoolFilters } from "./_components/SchoolFilters";
import { SchoolModal } from "./_components/SchoolModal";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";
import { useSchools } from "@/hooks/useSchool";
import { School } from "@/types/school";

export default function SchoolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | undefined>();
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const { schools, loading, createSchool, updateSchool, deleteSchool } = useSchools();

  const filteredAndSortedSchools = useMemo(() => {
    if (!schools) return [];

    let filtered = schools;
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      filtered = schools.filter(
        (s) =>
          s.name?.en?.toLowerCase().includes(lower) ||
          s.name?.th?.toLowerCase().includes(lower) ||
          s.acronym?.toLowerCase().includes(lower)
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name": {
          const nameA = a.name?.en ?? "";
          const nameB = b.name?.en ?? "";
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "acronym": {
          const acronymA = a.acronym ?? "";
          const acronymB = b.acronym ?? "";
          comparison = acronymA.localeCompare(acronymB);
          break;
        }
        case "majors": {
          const majorsA = a.majors?.length ?? 0;
          const majorsB = b.majors?.length ?? 0;
          comparison = majorsA - majorsB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [schools, searchQuery, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
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
      deleteSchool(selectedSchool._id);
      setSelectedSchool(undefined);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSubmitSchool = (schoolData: Partial<School>) => {
    if (selectedSchool && selectedSchool._id) {
      updateSchool(selectedSchool._id, schoolData);
    } else {
      createSchool(schoolData);
    }
    setIsModalOpen(false);
  };

  return (

    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Schools & Majors Management</h1>
        </div>
        <div className="flex flex-col gap-6">
          <SchoolFilters
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortByChange={setSortBy}
            onSortDirectionToggle={toggleSortDirection}
            onAddSchool={handleAddSchool}
          />
          {schools?.length === 0 && !loading && (
            <p className="text-center text-sm text-default-500">
              No schools found. Please add a new school.
            </p>
          )}
          <SchoolList
            schools={filteredAndSortedSchools}
            isLoading={loading}
            onEditSchool={handleEditSchool}
            onDeleteSchool={handleDeleteSchool}
          />
        </div>
      </div>
      <SchoolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSubmitSchool}
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

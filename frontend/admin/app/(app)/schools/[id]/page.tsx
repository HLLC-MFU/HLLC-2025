"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { ArrowLeft, Building2, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { MajorModal } from "./_components/MajorModal";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";
import { SchoolDetailSkeleton } from "./_components/SchoolDetailSkeleton";
import { useSchools } from "@/hooks/useSchool";
import { apiRequest } from "@/utils/api";
import type { School, Major } from "@/types/school";

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | undefined>();
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isLoading, setIsLoading] = useState(true);

  const { schools } = useSchools();

  useEffect(() => {
    const cachedSchool = schools.find((s) => s._id === id);
    if (cachedSchool) {
      setSchool(cachedSchool);
      setIsLoading(false);
    } else {
      // fallback to API (if needed)
      // e.g., apiRequest(`/schools/${id}`, "GET")...
    }
  }, [id, schools]);

  const handleAddMajor = () => {
    setModalMode("add");
    setSelectedMajor(undefined);
    setIsMajorModalOpen(true);
  };

  const handleEditMajor = (major: Major) => {
    setModalMode("edit");
    setSelectedMajor(major);
    setIsMajorModalOpen(true);
  };

  const handleDeleteMajor = (major: Major) => {
    setSelectedMajor(major);
    setIsDeleteModalOpen(true);
  };

  const handleSaveMajor = async (majorData: Partial<Major>, mode: "add" | "edit") => {
    if (!school) return;
    try {
      let res: Awaited<ReturnType<typeof apiRequest>> | undefined;
      if (mode === "add") {
        // POST
        res = await apiRequest("/majors", "POST", {
          ...majorData,
          school: school._id
        });
        console.log("Adding major:", res);
      } else if (mode === "edit" && majorData._id) {
        // PATCH
        res = await apiRequest(`/majors/${majorData._id}`, "PATCH", majorData);
      }
      if (res?.data && res.data !== null) {
        const updatedMajor = (res.data as { data: Major }).data;
        if (mode === "add") {
          setSchool({
            ...school,
            majors: [...(school.majors ?? []), updatedMajor]
          });
        } else {
          setSchool({
            ...school,
            majors: (school.majors ?? []).map((m) => (m._id === updatedMajor._id ? updatedMajor : m))
          });
        }
      }
    } catch (error) {
      console.error("Error saving major:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMajor || !school) return;
    try {
      await apiRequest(`/majors/${selectedMajor._id}`, "DELETE");
      setSchool({
        ...school,
        majors: (school.majors ?? []).filter((m) => m._id !== selectedMajor._id)
      });
      setIsDeleteModalOpen(false);
      setSelectedMajor(undefined);
    } catch (error) {
      console.error("Error deleting major:", error);
    }
  };

  if (isLoading) return <SchoolDetailSkeleton />;
  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-lg">School not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="flat" startContent={<ArrowLeft />} onPress={() => router.back()}>
              Back
            </Button>
            <h1 className="text-2xl font-bold">{school.name?.en ?? "Unnamed School"}</h1>
          </div>

          <Card>
            <CardHeader className="flex gap-3 p-4">
              <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                {school.acronym ?? "N/A"}
              </Card>
              <div className="flex flex-col">
                <p className="text-lg font-semibold">{school.name?.en ?? "N/A"}</p>
                <p className="text-small text-default-500">{school.name?.th ?? "N/A"}</p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-default-500" size={16} />
                <span className="text-sm text-default-500">{school.acronym ?? "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="text-default-500" size={16} />
                <span className="text-sm text-default-500">{school.majors?.length ?? 0} Programs</span>
              </div>
              <p className="text-sm text-default-500">{school.detail?.en ?? "No details available."}</p>
            </CardBody>
          </Card>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Majors</h2>
            <Button color="primary" startContent={<Plus size={16} />} onPress={handleAddMajor}>
              Add Major
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(school.majors ?? []).map((major) => (
              <Card key={major._id ?? major.acronym} isHoverable className="h-full">
                <CardHeader className="flex gap-3 p-4">
                  <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                    {major.acronym ?? "N/A"}
                  </Card>
                  <div className="flex flex-col items-start min-w-0 text-start">
                    <p className="text-lg font-semibold truncate w-full">{major.name?.en ?? "N/A"}</p>
                    <p className="text-small text-default-500 truncate w-full">{major.name?.th ?? "N/A"}</p>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="gap-4 p-4">
                  <p className="text-sm text-default-500 line-clamp-2">{major.detail?.en ?? "No details available."}</p>
                </CardBody>
                <Divider />
                <CardBody className="flex justify-end p-4">
                  <div className="flex gap-2">
                    <Button isIconOnly variant="light" size="sm" onPress={() => handleEditMajor(major)}>
                      <Pencil size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => handleDeleteMajor(major)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <MajorModal
        isOpen={isMajorModalOpen}
        onClose={() => setIsMajorModalOpen(false)}
        school={school._id}
        onSuccess={handleSaveMajor}
        major={selectedMajor}
        mode={modalMode}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        major={selectedMajor}
      />
    </div>
  );
}

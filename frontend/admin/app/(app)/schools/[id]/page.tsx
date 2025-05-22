"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { ArrowLeft, Building2, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import type { School, Major } from "@/types/school";
import { MajorModal } from "./_components/MajorModal";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";
import { SchoolDetailSkeleton } from "./_components/SchoolDetailSkeleton";
import { apiRequest } from "@/utils/api";
import { useSchools } from "@/hooks/useSchool";

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [school, setSchool] = useState<School>();
    const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMajor, setSelectedMajor] = useState<Major | undefined>();
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [isLoading, setIsLoading] = useState(true);
    const {schools} = useSchools();

    useEffect(() => {
        console.log(id);
        const school = schools?.find(school => school._id === id);
        if (school) {
            setSchool(school);
            setIsLoading(false);
        } else {
            apiRequest(`/schools/${id}`, "GET")
                .then((data) => {
                    setSchool(data.data as School);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching school data:", error);
                    setIsLoading(false);
                });
        }
    }, []);

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

    const handleSubmitMajor = (majorData: Major) => {
        if (modalMode === "add") {
            const newMajor: Major = {
                ...majorData,
                school: id,
            };
            setSchool(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    majors: [...prev.majors, newMajor]
                };
            });
        } else {
            setSchool(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    majors: prev.majors.map(major => 
                        major.id === majorData.id ? majorData : major
                    )
                };
            });
        }
    };

    const handleConfirmDelete = () => {
        if (selectedMajor) {
            setSchool(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    majors: prev.majors.filter(major => major.id !== selectedMajor.id)
                };
            });
            setIsDeleteModalOpen(false);
            setSelectedMajor(undefined);
        }
    };

    if (isLoading) {
        return <SchoolDetailSkeleton />;
    }

    if (!school) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg">School not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeft />}
                            onPress={() => router.back()}
                        >
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">{school.name.en}</h1>
                    </div>

                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card
                                radius="md"
                                className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                            >
                                {school.acronym}
                            </Card>
                            <div className="flex flex-col">
                                <p className="text-lg font-semibold">{school.name.en}</p>
                                <p className="text-small text-default-500">{school.name.th}</p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">{school.acronym}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GraduationCap className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">{school.majors.length} Programs</span>
                            </div>
                            <p className="text-sm text-default-500">{school.detail.en}</p>
                        </CardBody>
                    </Card>

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Majors</h2>
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onPress={handleAddMajor}
                        >
                            Add Major
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {school.majors.map((major) => (
                            <Card key={major.id} isHoverable className="h-full">
                                <CardHeader className="flex gap-3 p-4">
                                    <Card
                                        radius="md"
                                        className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                                    >
                                        {major.acronym}
                                    </Card>
                                    <div className="flex flex-col items-start text-left min-w-0">
                                        <p className="text-lg font-semibold truncate w-full">{major.name.en}</p>
                                        <p className="text-small text-default-500 truncate w-full">{major.name.th}</p>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="gap-4 p-4">
                                    <p className="text-sm text-default-500 line-clamp-2">
                                        {major.detail.en}
                                    </p>
                                </CardBody>
                                <Divider />
                                <CardBody className="flex justify-end p-4">
                                    <div className="flex gap-2">
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            size="sm"
                                            onPress={() => handleEditMajor(major)}
                                        >
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
                onSubmit={handleSubmitMajor}
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

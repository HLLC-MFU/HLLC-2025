'use client';

import { createSchool, CreateSchoolPayload, getSchools, updateSchool } from "@/api/schoolApi";
import SchoolAccordion from "@/components/Accordions/SchoolAccordion";
import { Schools } from "@/types/schools";
import { Button, Card, useDisclosure, Skeleton, Tooltip } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import MajorModal from "@/app/schools/_components/modals/majors/MajorModal";
import CreateSchoolModal from "./_components/modals/schools/CreateScoolModal";
import DetailSchoolModal from "./_components/modals/schools/DetailSchoolModal";
import { Majors } from "@/types/majors";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<Schools[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMajor, setSelectedMajor] = useState<Majors | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<Schools | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const router = useRouter();

    // Modal disclosures
    const majorModal = useDisclosure();
    const createModal = useDisclosure();
    const detailModal = useDisclosure();

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await getSchools();
                setSchools(response.data);
            } catch (err) {
                setError("Failed to fetch schools");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchools();
    }, []);

    // Clear the update success message after 3 seconds
    useEffect(() => {
        if (updateSuccess) {
            const timer = setTimeout(() => {
                setUpdateSuccess(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [updateSuccess]);

    const handleDetail = (schoolId: number) => {
        const school = schools.find(s => s.id === schoolId);
        if (school) {
            setSelectedSchool(school);
            detailModal.onOpen();
        }
    };

    const handleCreateMajor = (schoolId: number) => {
        console.log(`Create major for school ID: ${schoolId}`);
    };

    const handleShowMajorDetail = (major: Majors) => {
        setSelectedMajor(major);
        majorModal.onOpen();
    };

    const handleCreateSchool = async (schoolData: CreateSchoolPayload) => {
        try {
            const response = await createSchool({ ...schoolData, majors: [] });
            const created = response.data;
            setSchools((prev) => [...prev, created]);
        } catch (error) {
            console.error("Failed to create school:", error);
        }
    };

    const handleEditSchool = async (updatedSchool: Schools) => {
        try {
            await updateSchool(updatedSchool.id, updatedSchool);
            
            // Update the schools list with the edited school
            setSchools(prev => 
                prev.map(school => 
                    school.id === updatedSchool.id ? updatedSchool : school
                )
            );
            
            // Set success state
            setUpdateSuccess(true);
            
            // Close the modal
            detailModal.onClose();
        } catch (error) {
            console.error("Failed to update school:", error);
        }
    };

    return (
        <div className="mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Schools</h1>
                    {updateSuccess && (
                        <div className="flex items-center gap-1 text-green-600 mt-1 text-sm">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>School updated successfully</span>
                        </div>
                    )}
                </div>
                <Button
                    color="primary"
                    variant="solid"
                    startContent={<PlusCircleIcon className="w-5 h-5" />}
                    aria-label="Add School"
                    onPress={createModal.onOpen}
                    className="rounded-full"
                >
                    Add School
                </Button>
            </div>

            {loading ? (
                <Card className="w-full p-4 shadow-md rounded-lg border border-gray-200">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-full">
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </Card>
            ) : error ? (
                <div className="w-full p-4 bg-red-50 text-red-500 rounded-lg border border-red-200">
                    <p className="font-medium">{error}</p>
                    <p className="text-sm mt-1">Please try again later or contact support.</p>
                </div>
            ) : (
                <Card className="w-full p-4 bg-white shadow-md rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-4">
                        {schools.length > 0 ? (
                            schools.map((school) => (
                                <SchoolAccordion
                                    key={school.id}
                                    school={school}
                                    onDetail={handleDetail}
                                    onCreateMajor={handleCreateMajor}
                                    onShowMajorDetail={handleShowMajorDetail}
                                />
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <h3 className="text-lg font-medium text-gray-700 mb-2">No Schools Available</h3>
                                <p className="text-gray-500 mb-4">Get started by adding your first school.</p>
                                <Button 
                                    color="primary" 
                                    variant="solid"
                                    startContent={<PlusCircleIcon className="w-5 h-5" />}
                                    onPress={createModal.onOpen}
                                >
                                    Add First School
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Modals */}
            <MajorModal 
                isOpen={majorModal.isOpen} 
                onClose={majorModal.onClose} 
                major={selectedMajor} 
            />

            <CreateSchoolModal
                isOpen={createModal.isOpen}
                onClose={createModal.onClose}
                onCreate={handleCreateSchool}
            />

            <DetailSchoolModal
                isOpen={detailModal.isOpen}
                onClose={detailModal.onClose}
                school={selectedSchool}
                onShowMajorDetail={handleShowMajorDetail}
                onCreateMajor={handleCreateMajor}
                onEditSchool={handleEditSchool}
            />
        </div>
    );
}

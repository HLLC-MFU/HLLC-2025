'use client'
import { Accordion, AccordionItem, addToast, Button } from "@heroui/react";
import { University, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import ActivitiesTable from "./_components/ActivitiesTable";
import { ActivitiesTypeModal } from "./_components/ActivitiesTypeModal";
import ActivitiesModal from "./_components/ActivitiesModal";
import TopContent from "./_components/TopContent";
import { ConfirmModal } from "./_components/ConfirmModal";
import ActivitiesDetailModal from "./_components/ActivitiesDetailCard";

import { Activities, ActivityType } from "@/types/activities";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";
import { useActivities } from "@/hooks/useActivities";
import { PageHeader } from "@/components/ui/page-header";

export default function ActivitiesPage() {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedActivityDetail, setSelectedActivityDetail] = useState<Activities | undefined>(undefined);
    const { activities, activityTypes, loading, updateActivityType, createActivityType, fetchActivities, updateActivity, createActivity, deleteActivity, deleteActivityType } = useActivities({ autoFetch: true });
    const { schools } = useSchools();
    const { majors } = useMajors();
    const { users } = useUsers();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedActivitiesType, setSelectedActivitiesType] = useState<ActivityType | undefined>();
    const [selectedActivity, setSelectedActivity] = useState<Activities | undefined>();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isConfirmTypeOpen, setIsConfirmTypeOpen] = useState(false);
    const [selectedActivitiesTypeToDelete, setSelectedActivitiesTypeToDelete] = useState<ActivityType | undefined>()
    const [searchForType, setSearchForType] = useState<{ id: string; query: string }>({ id: '', query: '' });

    const filteredActivities = useMemo(() => {
        if (!activities) return [];

        return activities.filter((activity) => {
            const searchLower = searchQuery.toLowerCase();

            return (
                activity.name?.en?.toLowerCase().includes(searchLower) ||
                activity.name?.th?.toLowerCase().includes(searchLower) ||
                activity.acronym?.toLowerCase().includes(searchLower) ||
                activity.location?.en?.toLowerCase().includes(searchLower) ||
                activity.location?.th?.toLowerCase().includes(searchLower)
            );
        });
    }, [activities, searchQuery]);

    const filteredActivitiesByType = (typeId: string) => {
        const query = (searchForType.id === typeId) ? searchForType.query.toLowerCase() : "";

        return activities.filter(activity => {
            let activityTypeId: string | undefined;

            if (typeof activity.type === 'string') {
                const matchedType = activityTypes.find(t => t.name === activity.type);

                activityTypeId = matchedType?._id;
            } else {
                activityTypeId = activity.type?._id;
            }
            if (activityTypeId !== typeId) return false;
            if (!query) return true;

            return (
                activity.name?.en?.toLowerCase().includes(query) ||
                activity.name?.th?.toLowerCase().includes(query) ||
                activity.acronym?.toLowerCase().includes(query) ||
                activity.location?.en?.toLowerCase().includes(query) ||
                activity.location?.th?.toLowerCase().includes(query)
            );
        });
    };


    const handleAddActivity = (activityType: ActivityType) => {
        setSelectedActivity(undefined);
        setModalMode('add');
        setSelectedActivitiesType(activityType);
        setIsActivityModalOpen(true);
    };

    const handleAddType = () => {
        setModalMode('add');
        setSelectedActivitiesType(undefined);
        setIsTypeModalOpen(true);
    };

    const handleEditType = (activityType: ActivityType) => {
        setModalMode('edit');
        setSelectedActivitiesType(activityType);
        setIsTypeModalOpen(true);
    };

    const handleViewDetail = (activity: Activities) => {
        setSelectedActivityDetail(activity);
        setIsDetailModalOpen(true);
    };

    const handleDeleteActivity = (activity: Activities) => {
        setSelectedActivity(activity);
        setIsConfirmOpen(true);
    };

    const handleDeleteType = (activityType: ActivityType) => {
        setSelectedActivitiesTypeToDelete(activityType);
        setIsConfirmTypeOpen(true);
    };

    const handleConfirmDeleteType = async () => {
        if (!selectedActivitiesTypeToDelete) return;

        try {
            // สมมติว่า deleteActivityType มีใน useActivities (เพิ่มเองถ้ายังไม่มี)
            await deleteActivityType(selectedActivitiesTypeToDelete._id);
            await fetchActivities();
            addToast({
                title: 'Deleted',
                description: 'Activity type deleted successfully.',
                color: 'success'
            });
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to delete activity type.',
                color: 'danger',
            });
        } finally {
            setIsConfirmTypeOpen(false);
            setSelectedActivitiesTypeToDelete(undefined);
        }
    };

    const handleConfirmDeleteActivity = async () => {
        if (!selectedActivity) return;

        try {
            await deleteActivity(selectedActivity._id);
            await fetchActivities();
        } catch (error) {
            addToast({
                title: "Error",
                description: "Failed to delete activity.",
                color: "danger",
            });
        } finally {
            setIsConfirmOpen(false);
            setSelectedActivity(undefined);
        }
    };

    const handleSubmitActivity = async (formData: FormData, mode: 'add' | 'edit') => {
        try {
            if (mode === 'edit' && selectedActivity) {
                await updateActivity(selectedActivity._id, formData);
            } else {
                const res = await createActivity(formData);
                
            }
        } catch (error) {
            console.error('Error creating/updating activity:', error);
        } finally {
            setIsActivityModalOpen(false);
            await fetchActivities();
        }
    };

    const handleSubmitType = async (typeData: Partial<ActivityType>) => {
        try {
            if (modalMode === 'edit' && selectedActivitiesType) {
                await updateActivityType(selectedActivitiesType._id, typeData);
            } else {
                await createActivityType(typeData);
            }
            setIsTypeModalOpen(false);
            await fetchActivities();
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to create activity type. Please try again.',
                color: 'danger'
            });
        }
    };

    return (
        <>
            <PageHeader
                description="Manage users, roles, and relative data."
                icon={<University />}
                right={
                    <Button
                        color="primary"
                        endContent={<Plus size={20} />}
                        size="lg"
                        onPress={handleAddType}
                    >
                        New Type
                    </Button>
                }
                title="Activities Management"
            />
            <Accordion selectionMode="multiple" variant="splitted">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <AccordionItem
                            key={`skeleton-${index}`}
                            aria-label={`Loading ${index}`}
                            title={
                                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                            }
                        >
                            <div className="h-[100px] w-full bg-gray-100 rounded-md animate-pulse" />
                        </AccordionItem>
                    ))
                ) : (
                    activityTypes.map((activityType) => {
                        const activityName = activityType.name ?? "Unnamed";
                        const activitiesForType = filteredActivitiesByType(activityType._id);

                        return (
                            <AccordionItem
                                key={activityType._id}
                                aria-label={String(activityName)}
                                className="font-medium mb-2"
                                title={activityName}
                            >
                                <div className="mb-5 flex justify-between w-full">
                                    <TopContent
                                        filterValue={searchForType.id === activityType._id ? searchForType.query : ""}
                                        onAdd={() => handleAddActivity(activityType)}
                                        onClear={() => setSearchForType({ id: activityType._id, query: "" })}
                                        onDelete={() => handleDeleteType(activityType)}
                                        onEdit={() => handleEditType(activityType)}
                                        onSearchChange={(value) => setSearchForType({ id: activityType._id, query: value })}
                                    />
                                </div>

                                {activitiesForType.length > 0 ? (
                                    <ActivitiesTable
                                        activities={activitiesForType}
                                        majors={majors}
                                        schools={schools}
                                        users={users}
                                        onAdd={() => handleAddActivity(activityType)}
                                        onDelete={(activity) => handleDeleteActivity(activity)}
                                        onEdit={(activity) => {
                                            setSelectedActivity(activity);
                                            setModalMode("edit");
                                            setIsActivityModalOpen(true);
                                        }}
                                        onViewDetail={handleViewDetail}
                                    />
                                ) : (
                                    <div className="p-4 text-sm text-gray-500">
                                        No activities available for this type.
                                    </div>
                                )}
                            </AccordionItem>
                        );
                    })
                )}
            </Accordion>

            <ActivitiesModal
                activity={selectedActivity}
                activityTypes={activityTypes}
                isOpen={isActivityModalOpen}
                majors={majors}
                mode={modalMode}
                schools={schools}
                typeId={selectedActivitiesType?._id ?? ""}
                users={users}
                onClose={() => setIsActivityModalOpen(false)}
                onSubmit={handleSubmitActivity}
            />

            <ActivitiesTypeModal
                activityType={selectedActivitiesType}
                isOpen={isTypeModalOpen}
                mode={modalMode}
                onClose={() => setIsTypeModalOpen(false)}
                onSubmit={handleSubmitType}
            />
            <ActivitiesDetailModal
                activity={selectedActivityDetail!}
                isOpen={isDetailModalOpen}
                majors={majors}
                schools={schools}
                users={users}
                onClose={() => setIsDetailModalOpen(false)}
            />

            {/* Confirm modal สำหรับลบ Activity */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                subtitle="Are you sure you want to delete this activity?"
                title="Confirm Delete"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDeleteActivity}
            />
            {/* Confirm modal สำหรับลบ Activity Type */}
            <ConfirmModal
                isOpen={isConfirmTypeOpen}
                subtitle="Are you sure you want to delete this activity type?"
                title="Confirm Delete Type"
                onClose={() => setIsConfirmTypeOpen(false)}
                onConfirm={handleConfirmDeleteType}
            />
        </>
    )
}
'use client'
import { PageHeader } from "@/components/ui/page-header";
import { useActivities } from "@/hooks/useActivities";
import { Accordion, AccordionItem, addToast, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, useUser } from "@heroui/react";
import { University, Plus, EllipsisVertical, Pen, Trash } from "lucide-react";
import ActivitiesTable from "./_components/ActivitiesTable";
import { useMemo, useState } from "react";
import { ActivitiesTypeModal } from "./_components/ActivitiesTypeModal";
import { Activities, ActivityType } from "@/types/activities";
import ActivitiesModal from "./_components/ActivitiesModal";
import TopContent from "./_components/TopContent";
import { ConfirmModal } from "./_components/ConfirmModal";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";

export default function ActivitiesPage() {
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
        return filteredActivities.filter((activity) => {
            let activityTypeId: string | undefined;

            if (typeof activity.type === 'string') {
                const matchedType = activityTypes.find(t => t.name === activity.type);
                activityTypeId = matchedType?._id;
            } else {
                activityTypeId = activity.type?._id;
            }

            return activityTypeId === typeId;
        });
    };

    const handleAddActivity = (activityType: ActivityType) => {
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
                await createActivity(formData);
                console.log('Activity created successfully');
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
            <Accordion variant="splitted">
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
                                        filterValue={searchQuery}
                                        onClear={() => setSearchQuery("")}
                                        onSearchChange={setSearchQuery}
                                        onAdd={() => handleAddActivity(activityType)}
                                        onEdit={() => handleEditType(activityType)}
                                        onDelete={() => handleDeleteType(activityType)}
                                    />
                                </div>

                                {activitiesForType.length > 0 ? (
                                    <ActivitiesTable
                                        onAdd={() => handleAddActivity(activityType)}
                                        onEdit={(activity) => {
                                            setSelectedActivity(activity);
                                            setModalMode("edit");
                                            setIsActivityModalOpen(true);
                                        }}
                                        onDelete={(activity) => handleDeleteActivity(activity)}
                                        activities={activitiesForType}
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
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                onSubmit={handleSubmitActivity}
                mode={modalMode}
                activity={selectedActivity}
                typeId={selectedActivitiesType?._id ?? ""}
                activityTypes={activityTypes}
                schools={schools}
                majors={majors}
                users={users}
            />

            <ActivitiesTypeModal
                isOpen={isTypeModalOpen}
                mode={modalMode}
                activityType={selectedActivitiesType}
                onClose={() => setIsTypeModalOpen(false)}
                onSubmit={handleSubmitType}
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
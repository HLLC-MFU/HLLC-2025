'use client'
import { PageHeader } from "@/components/ui/page-header";
import { useActivities } from "@/hooks/useActivities";
import { Accordion, AccordionItem, addToast, Button } from "@heroui/react";
import { University, Plus, PlusIcon } from "lucide-react";
import ActivitiesTable from "./_components/ActivitiesTable";
import { useMemo, useState } from "react";
import { ActivitiesTypeModal } from "./_components/ActivitiesTypeModal";
import { Activities, ActivityType } from "@/types/activities";
import ActivitiesModal from "./_components/ActivitiesModal";
import TopContent from "./_components/TopContent";

export default function ActivitiesPage() {
    const { activities, activityTypes, loading, updateActivityType, createActivityType, fetchActivities, updateActivity, createActivity } = useActivities({ autoFetch: true });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedActivitiesType, setSelectedActivitiesType] = useState<ActivityType | undefined>();
    const [selectedActivity, setSelectedActivity] = useState<Activities | undefined>();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");

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


    const handleAddActivity = (activityType: ActivityType) => {
        setModalMode('add');
        setSelectedActivitiesType(activityType);
        setIsActivityModalOpen(true);
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
                        onPress={() => setIsTypeModalOpen(true)}
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
                        const filteredActivities = activities.filter((activity) => {
                            let typeId: string | undefined;
                            if (typeof activity.type === 'string') {
                                const matchedType = activityTypes.find(t => t.name === activity.type);
                                typeId = matchedType?._id;
                            } else {
                                typeId = activity.type?._id;
                            }
                            console.log('Comparing:', typeId, activityType._id);
                            return typeId === activityType._id;
                        });

                        return (
                            <AccordionItem
                                key={activityType._id}
                                aria-label={String(activityName)}
                                className="font-medium mb-2"
                                title={activityName}
                            >
                                <div className="mb-5">
                                    <TopContent
                                        filterValue={filterValue}
                                        onClear={() => setFilterValue("")}
                                        onSearchChange={setFilterValue}
                                        onAdd={() => handleAddActivity(activityType)}
                                    />
                                </div>

                                {filteredActivities.length > 0 ? (
                                    <ActivitiesTable
                                        onAdd={() => handleAddActivity(activityType)}
                                        onEdit={(activity) => {
                                            setSelectedActivity(activity);
                                            setModalMode("edit");
                                            setIsActivityModalOpen(true);
                                        }}
                                        onDelete={() => { }} // implement later
                                        activities={filteredActivities}
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
            />

            <ActivitiesTypeModal
                isOpen={isTypeModalOpen}
                mode={modalMode}
                activityType={selectedActivitiesType}
                onClose={() => setIsTypeModalOpen(false)}
                onSubmit={handleSubmitType}
            />
        </>
    )
}
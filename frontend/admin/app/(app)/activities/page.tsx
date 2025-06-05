'use client';
import { useMemo, useState } from 'react';
import { addToast } from '@heroui/react';
import { 
  Accordion, 
  AccordionItem, 
  Button, 
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { 
  Building2, 
  Plus, 
  Search, 
  School, 
  Calendar, 
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';

import { ActivityModal } from './_components/ActivityModal';
import { ActivityTypeModal } from './_components/ActivityTypeModal';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { PageHeader } from '@/components/ui/page-header';
import { useActivities } from '@/hooks/useActivities';
import { Activities, ActivityType } from '@/types/activities';
import ActivitiesTable from "./_components/activities-table";

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activities | undefined>();
  const [selectedType, setSelectedType] = useState<ActivityType | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [confirmationModalType, setConfirmationModalType] = useState<'delete' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'activity' | 'type' | null>(null);

  const {
    activities,
    activityTypes,
    createActivity,
    updateActivity,
    deleteActivity,
    createActivityType,
    updateActivityType,
    deleteActivityType,
    loading,
    fetchActivities,
  } = useActivities();

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

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activities[]> = {};
    
    filteredActivities.forEach((activity) => {
      const typeId = activity.type || 'other';
      if (!groups[typeId]) {
        groups[typeId] = [];
      }
      groups[typeId].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const handleAddActivity = (typeId: string) => {
    setModalMode('add');
    setSelectedActivity(undefined);
    setSelectedActivity({ type: typeId } as Activities);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity: Activities) => {
    setModalMode('edit');
    setSelectedActivity(activity);
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = (activity: Activities) => {
    setSelectedActivity(activity);
    setDeleteTarget('activity');
    setConfirmationModalType('delete');
  };

  const handleEditType = (type: ActivityType) => {
    setModalMode('edit');
    setSelectedType(type);
    setIsTypeModalOpen(true);
  };

  const handleDeleteType = (type: ActivityType) => {
    setSelectedType(type);
    setDeleteTarget('type');
    setConfirmationModalType('delete');
  };

  const handleSubmitActivity = (formData: FormData, mode: 'add' | 'edit') => {
    if (mode === 'edit' && selectedActivity) {
      updateActivity(selectedActivity._id, formData);
    } else {
      createActivity(formData);
    }
    setIsActivityModalOpen(false);
  };

  const handleSubmitType = async (typeData: Partial<ActivityType>) => {
    try {
      if (modalMode === 'edit' && selectedType) {
        await updateActivityType(selectedType._id, typeData);
      } else {
        await createActivityType(typeData);
      }
      setIsTypeModalOpen(false);
      await fetchActivities();
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to save activity type. Please try again.',
        color: 'danger'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmationModalType) return;

    try {
      if (deleteTarget === 'type' && selectedType) {
        await deleteActivityType(selectedType._id);
        await fetchActivities();
      } else if (deleteTarget === 'activity' && selectedActivity) {
        await deleteActivity(selectedActivity._id);
        await fetchActivities();
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete. Please try again.',
        color: 'danger'
      });
    } finally {
      setConfirmationModalType(null);
      setSelectedType(undefined);
      setSelectedActivity(undefined);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <PageHeader 
          title="Activities Management" 
          description="Manage your activities and activity types" 
          icon={<School className="w-7 h-7" />} 
        />
        
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Activity Types & Activities</h1>
            <Button 
              color="primary"
              endContent={<Plus className="w-4 h-4" />}
              onPress={() => {
                setModalMode('add');
                setSelectedType(undefined);
                setIsTypeModalOpen(true);
              }}
              size="md"
            >
              New Activity Type
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                isClearable
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="w-full sm:max-w-[44%]"
                placeholder="Search activities..."
                startContent={<Search className="text-default-400 w-4 h-4" />}
                size="sm"
              />
            </div>

            {activityTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-xl bg-default-50">
                <Calendar className="w-12 h-12 text-default-300 mb-4" />
                <p className="text-default-500 text-center mb-2">No activity types found</p>
                <p className="text-sm text-default-400 text-center mb-4">Create your first activity type to get started</p>
              </div>
            ) : (
              <Accordion 
                variant="splitted"
                defaultExpandedKeys={activityTypes.length > 0 ? [activityTypes[0]._id] : []}
                selectionMode="multiple"
                className="gap-4"
              >
                {activityTypes.map((type) => {
                  const typeActivities = groupedActivities[type._id] || [];
                  return (
                    <AccordionItem
                      key={type._id}
                      aria-label={type.name}
                      startContent={
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      }
                      title={
                        <div className="flex justify-between items-center w-full pr-4">
                          <div>
                            <p className="text-lg font-medium">{type.name}</p>
                            <p className="text-sm text-default-400">{typeActivities.length} activities</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              color="primary"
                              size="sm"
                              variant="flat"
                              endContent={<Plus className="w-4 h-4" />}
                              onPress={() => handleAddActivity(type._id)}
                            >
                              Add Activity
                            </Button>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly variant="light" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="edit"
                                  startContent={<Pencil className="w-4 h-4" />}
                                  onPress={() => handleEditType(type)}
                                >
                                  Edit Type
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<Trash2 className="w-4 h-4" />}
                                  onPress={() => handleDeleteType(type)}
                                >
                                  Delete Type
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                      }
                      classNames={{
                        base: "bg-white rounded-xl shadow-md mb-4",
                        title: "font-medium text-large",
                        content: "px-4 pb-4",
                        trigger: "px-6 py-4",
                      }}
                    >
                      {typeActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed rounded-xl bg-default-50">
                          <Calendar className="w-12 h-12 text-default-300 mb-4" />
                          <p className="text-default-500 text-center mb-2">No activities in this type yet</p>
                          <p className="text-sm text-default-400 text-center mb-4">Create your first activity in {type.name}</p>
                        </div>
                      ) : (
                        <div className="w-full overflow-x-auto">
                          <ActivitiesTable
                            activities={typeActivities}
                            onEdit={handleEditActivity}
                            onDelete={handleDeleteActivity}
                          />
                        </div>
                      )}
                    </AccordionItem>                  
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      <ActivityModal
        isOpen={isActivityModalOpen}
        mode={modalMode}
        activity={selectedActivity}
        onClose={() => setIsActivityModalOpen(false)}
        onSuccess={handleSubmitActivity}
      />

      <ActivityTypeModal
        isOpen={isTypeModalOpen}
        mode={modalMode}
        activityType={selectedType}
        onClose={() => setIsTypeModalOpen(false)}
        onSubmit={handleSubmitType}
        loading={loading}
      />

      <ConfirmationModal
        body={
          deleteTarget === 'type'
            ? `Are you sure you want to delete the activity type "${selectedType?.name}"? This will also delete all activities in this type.`
            : `Are you sure you want to delete the activity "${selectedActivity?.name?.en}"?`
        }
        confirmColor="danger"
        confirmText={loading ? 'Deleting...' : 'Delete'}
        isOpen={confirmationModalType === 'delete'}
        title={deleteTarget === 'type' ? 'Delete Activity Type' : 'Delete Activity'}
        onClose={() => {
          setConfirmationModalType(null);
          setSelectedType(undefined);
          setSelectedActivity(undefined);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
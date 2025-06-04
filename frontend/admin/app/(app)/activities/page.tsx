'use client';
import { useMemo, useState } from 'react';
import { addToast } from '@heroui/react';
import { Accordion, AccordionItem } from '@heroui/react';

import { ActivityList } from './_components/ActivityList';
import { ActivityModal } from './_components/ActivityModal';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { useActivities } from '@/hooks/useActivities';
import { Activities, ActivityType } from '@/types/activities';
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, ButtonGroup } from '@heroui/react';
import { SearchIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, Building2 } from 'lucide-react';

const sortOptions = [
  { name: "name", label: "Name" },
  { name: "acronym", label: "Acronym" },
  { name: "location", label: "Location" }
];

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<
    Activities | Partial<Activities> | undefined
  >();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [confirmationModalType, setConfirmationModalType] = useState<
    'delete' | 'edit' | null
  >(null);

  const { activities, activityTypes, loading, createActivity, updateActivity, deleteActivity } =
    useActivities();

  const filteredAndSortedActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();

      filtered = activities.filter(
        (a) =>
          a.name?.en?.toLowerCase().includes(lower) ||
          a.name?.th?.toLowerCase().includes(lower) ||
          a.acronym?.toLowerCase().includes(lower) ||
          a.location?.en?.toLowerCase().includes(lower) ||
          a.location?.th?.toLowerCase().includes(lower),
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name?.en ?? '').localeCompare(b.name?.en ?? '');
          break;
        case 'acronym':
          comparison = (a.acronym ?? '').localeCompare(b.acronym ?? '');
          break;
        case 'location':
          comparison = (a.location?.en ?? '').localeCompare(b.location?.en ?? '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activities, searchQuery, sortBy, sortDirection]);

  // Group activities by type
  const groupedActivities = useMemo(() => {
    if (!filteredAndSortedActivities) return {};

    const groups: Record<string, Activities[]> = {};
    
    filteredAndSortedActivities.forEach((activity) => {
      const typeId = activity.type || 'other';
      if (!groups[typeId]) {
        groups[typeId] = [];
      }
      groups[typeId].push(activity);
    });

    return groups;
  }, [filteredAndSortedActivities]);

  // Get type name from type ID
  const getTypeName = (typeId: string) => {
    const type = activityTypes.find(t => t._id === typeId);
    return type?.name || 'Other';
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleAddActivity = () => {
    setModalMode('add');
    setSelectedActivity(undefined);
    setIsModalOpen(true);
  };

  const handleEditActivity = (activity: Activities) => {
    setModalMode('edit');
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleDeleteActivity = (activity: Activities) => {
    setSelectedActivity(activity);
    setConfirmationModalType('delete');
  };

  const handleSubmitActivity = (formData: FormData, mode: "add" | "edit") => {
    if (mode === "edit" && selectedActivity && '_id' in selectedActivity && selectedActivity._id) {
      updateActivity(selectedActivity._id, formData);
    } else {
      createActivity(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    if (
      confirmationModalType === 'delete' &&
      selectedActivity &&
      selectedActivity._id
    ) {
      deleteActivity(selectedActivity._id);
    } else if (
      confirmationModalType === 'edit' &&
      selectedActivity &&
      selectedActivity._id
    ) {
      updateActivity(selectedActivity._id, selectedActivity);
    }
    setConfirmationModalType(null);
    setSelectedActivity(undefined);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Activities Management</h1>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                isClearable
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="w-full"
                placeholder="Search activities..."
                startContent={<SearchIcon className="text-default-400" />}
              />
              <div className="flex gap-2 sm:gap-3">
                <ButtonGroup className="flex-1 sm:flex-none">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="flat" className="w-full sm:w-auto">
                        Sort by: {sortOptions.find(opt => opt.name === sortBy)?.label}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Sort Options"
                      onAction={(key) => setSortBy(key.toString())}
                    >
                      {sortOptions.map((option) => (
                        <DropdownItem key={option.name} className="capitalize">
                          {option.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                  <Button
                    variant="flat"
                    isIconOnly
                    onPress={toggleSortDirection}
                    className="flex-shrink-0"
                  >
                    {sortDirection === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </Button>
                </ButtonGroup>
                <Button
                  color="primary"
                  endContent={<PlusIcon />}
                  onPress={handleAddActivity}
                  className="flex-1 sm:flex-none"
                >
                  Add Activity
                </Button>
              </div>
            </div>
          </div>

          {activities?.length === 0 && !loading && (
            <p className="text-center text-sm text-default-500">
              No activities found. Please add a new activity.
            </p>
          )}

          <Accordion variant="splitted">
            {Object.entries(groupedActivities).map(([typeId, activities]) => (
              <AccordionItem
                key={typeId}
                aria-label={getTypeName(typeId)}
                startContent={<Building2 />}
                title={`${getTypeName(typeId)} (${activities.length})`}
                className="font-medium mb-2"
              >
                <ActivityList
                  isLoading={loading}
                  activities={activities}
                  onDeleteActivity={handleDeleteActivity}
                  onEditActivity={handleEditActivity}
                />
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <ActivityModal
        isOpen={isModalOpen}
        mode={modalMode}
        activity={
          selectedActivity && '_id' in selectedActivity
            ? (selectedActivity as Activities)
            : undefined
        }
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSubmitActivity}
      />

      <ConfirmationModal
        body={
          confirmationModalType === 'edit'
            ? `Are you sure you want to save the changes for "${selectedActivity?.name?.en}"?`
            : `Are you sure you want to delete the activity "${selectedActivity?.name?.en}"? This action cannot be undone.`
        }
        confirmColor={confirmationModalType === 'edit' ? 'primary' : 'danger'}
        confirmText={confirmationModalType === 'edit' ? 'Save' : 'Delete'}
        isOpen={confirmationModalType !== null}
        title={
          confirmationModalType === 'edit' ? 'Save Activity' : 'Delete Activity'
        }
        onClose={() => {
          setConfirmationModalType(null);
          setSelectedActivity(undefined);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
} 
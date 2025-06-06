'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';

import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { ActivityModal } from '../_components/ActivityModal';
import { useActivities } from '@/hooks/useActivities';
import { useState } from 'react';
import { Activities } from '@/types/activities';

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { activities, loading, updateActivity, deleteActivity } = useActivities();
  const activity = useMemo(
    () => activities.find((a) => a._id === id),
    [activities, id],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<
    Activities | Partial<Activities> | undefined
  >();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
  const [confirmationModalType, setConfirmationModalType] = useState<
    'delete' | 'edit' | null
  >(null);

  const handleEditActivity = () => {
    setModalMode('edit');
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleDeleteActivity = () => {
    setSelectedActivity(activity);
    setConfirmationModalType('delete');
  };

  const handleSaveActivity = async (
    activityData: Partial<Activities>,
    mode: 'add' | 'edit',
  ) => {
    if (!activity) return;

    setSelectedActivity(activityData);
    setConfirmationModalType('edit');
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!activity || !selectedActivity) return;

    setConfirmationModalType(null);
    setSelectedActivity(undefined);

    if (confirmationModalType === 'delete') {
      await deleteActivity(activity._id);
      router.push('/activities');
    } else if (confirmationModalType === 'edit') {
      await updateActivity(activity._id, selectedActivity as FormData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-lg">Loading...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-lg">Activity not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button
              startContent={<ArrowLeft />}
              variant="flat"
              onPress={() => router.back()}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold">
              {activity.name?.en ?? 'Unnamed Activity'}
            </h1>
          </div>

          <Card>
            <CardHeader className="flex gap-3 p-4">
              <Card
                className="w-12 h-12 flex items-center justify-center"
                radius="md"
              >
                {activity.acronym}
              </Card>
              <div className="flex flex-col">
                <p className="text-lg font-semibold">
                  {activity.name?.en ?? 'N/A'}
                </p>
                <p className="text-small text-default-500">
                  {activity.name?.th ?? 'N/A'}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-default-500" size={16} />
                <span className="text-sm text-default-500">
                  {activity.acronym ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-default-500" size={16} />
                <span className="text-sm text-default-500">
                  {activity.type ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-default-500" size={16} />
                <span className="text-sm text-default-500">
                  {activity.location?.en ?? 'N/A'}
                </span>
              </div>
              <p className="text-sm text-default-500">
                {activity.fullDetails?.en ?? 'No details available.'}
              </p>
            </CardBody>
            <Divider />
            <CardBody className="flex justify-end p-4">
              <div className="flex gap-2">
                <Button
                  startContent={<Pencil size={16} />}
                  color="primary"
                  variant="flat"
                  onPress={handleEditActivity}
                >
                  Edit Activity
                </Button>
                <Button
                  startContent={<Trash2 size={16} />}
                  color="danger"
                  variant="flat"
                  onPress={handleDeleteActivity}
                >
                  Delete Activity
                </Button>
              </div>
            </CardBody>
          </Card>
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
        onSuccess={handleSaveActivity as (formData: FormData, mode: 'add' | 'edit') => Promise<void>}
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
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { MapPin } from 'lucide-react';
import { useLandmarks } from '@/hooks/useLandmarks';
import LandmarkTable from './_components/LandmarkTable';
import { LandmarkModal } from './_components/LandmarkModal';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { Landmark } from '@/types/landmark';

export default function LandmarksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

  const {
    landmarks,
    loading,
    fetchLandmarks,
    createLandmark,
    updateLandmark,
    deleteLandmark
  } = useLandmarks();

  const handleAdd = () => {
    setModalMode('add');
    setSelectedLandmark(null);
    setIsModalOpen(true);
  };

  const handleEdit = (landmark: Landmark) => {
    setModalMode('edit');
    setSelectedLandmark(landmark);
    setIsModalOpen(true);
  };

  const handleDelete = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async (landmarkData: FormData) => {
    if (modalMode === 'add') {
      await createLandmark(landmarkData);
    } else if (modalMode === 'edit' && selectedLandmark?._id) {
      await updateLandmark(selectedLandmark._id, landmarkData);
    }
    await fetchLandmarks();
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedLandmark?._id) return;
    await deleteLandmark(selectedLandmark._id);
    await fetchLandmarks();
    setSelectedLandmark(null);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <PageHeader
        description="Manage landmarks for coin hunting"
        icon={<MapPin />}
        title="Landmarks"
      />
      <div className="flex flex-col gap-6">
        <LandmarkTable
          landmarks={landmarks}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <LandmarkModal
          isOpen={isModalOpen}
          mode={modalMode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLandmark(null);
          }}
          onSuccess={handleSubmit}
          landmark={selectedLandmark}
        />
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirm}
          title={"Delete Landmark"}
          body={`Are you sure you want to delete "${selectedLandmark?.name?.en}" landmark?`}
          confirmText='Delete'
          confirmColor='danger'
        />
      </div>
    </>
  );
}

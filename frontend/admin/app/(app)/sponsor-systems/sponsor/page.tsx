'use client';

import { useMemo, useState } from 'react';
import { Accordion, AccordionItem, Button, Skeleton } from '@heroui/react';
import { ArrowLeft, BadgeDollarSign, Plus } from 'lucide-react';
import SponsorTable from './_components/SponsorTable';
import { useSponsors } from '@/hooks/useSponsors';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { Sponsors } from '@/types/sponsors';
import { useSponsorsType } from '@/hooks/useSponsorsType';
import { PageHeader } from '@/components/ui/page-header';
import AddSponsorTypeModal from './_components/AddSponsorTypeModal';
import { useRouter } from 'next/navigation';

export default function SponsorPage() {
  const router = useRouter();
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedSponsor, setSelectedSponsor] = useState<Partial<Sponsors> | null>();

  const {
    sponsors,
    loading: sponsorsLoading,
    createSponsors,
    updateSponsors,
    deleteSponsors,
    fetchSponsors,
  } = useSponsors();

  const { loading: typeLoading, sponsorsType, createSponsorsType } = useSponsorsType();

  const isLoading = sponsorsLoading || typeLoading;

  const groupedSponsors = useMemo(() => {
    const groups: Record<string, { priority: number; sponsors: Sponsors[] }> = {};

    sponsorsType.forEach((type) => {
      groups[type.name] = {
        priority: type.priority,
        sponsors: [],
      };
    });

    sponsors?.forEach((s) => {
      const typeName =
        typeof s.type === 'object' && s.type !== null && 'name' in s.type
          ? (s.type as { name: string }).name
          : s.type || 'Unknown';

      if (!groups[typeName])
        groups[typeName] = {
          priority: 999,
          sponsors: [],
        };
      groups[typeName].sponsors.push(s);
    });

    return groups;
  }, [sponsors, sponsorsType]);

  const handleAdd = () => {
    setModalMode('add');
    setSelectedSponsor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sponsor: Sponsors) => {
    setModalMode('edit');
    setSelectedSponsor(sponsor);
    setIsModalOpen(true);
  };

  const handleDelete = (sponsor: Sponsors) => {
    setSelectedSponsor(sponsor);
    setConfirmationModal(true);
  };

  const handleSubmit = async (sponsorsData: FormData) => {
    let response;

    if (modalMode === 'add') {
      response = await createSponsors(sponsorsData);
    } else if (modalMode === 'edit' && selectedSponsor?._id) {
      response = await updateSponsors(selectedSponsor._id, sponsorsData);
    }

    if (response) {
      await fetchSponsors()
      setIsModalOpen(false);
    };
  };

  const handleConfirm = async () => {
    if (!selectedSponsor?._id) return;

    await deleteSponsors(selectedSponsor._id);
    await fetchSponsors();
    
    setConfirmationModal(false);
    setSelectedSponsor(null);
  };

  const handleAddType = async (type: { name: string; priority: number }) => {
    await createSponsorsType(type);
    setIsTypeOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto">
        <PageHeader
          description="Manage sponsor"
          icon={<BadgeDollarSign />}
          right={
            <div className="w-full sm:w-auto">
              <Button
                color="primary"
                endContent={<Plus size={20} />}
                size="lg"
                onPress={() => setIsTypeOpen(true)}
              >
                New sponsor type
              </Button>
            </div>
          }
          title="Sponsor"
        />
        <div className="flex items-center gap-4 w-full mx-auto mb-4">
          <Button
            variant="flat"
            size="lg"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.back()}
            className="hover:bg-gray-100 transition-colors mb-2"
          >
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          <Accordion className="p-0" variant="splitted">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <AccordionItem
                    key={`skeleton-${index}`}
                    aria-label={`Loading ${index}`}
                    title={
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    }
                  >
                    <Skeleton className="h-[100px] w-full bg-gray-100 rounded-md" />
                  </AccordionItem>
                ))
            ) : (
              Object.entries(groupedSponsors)
                .sort(([, prev], [, next]) => prev.priority - next.priority)
                .map(([type, sponsors]) => {
                  return (
                    <AccordionItem
                      key={sponsors.priority}
                      aria-label={type}
                      title={`${type}`}
                      subtitle={
                        <p className="flex gap-1">
                          <span>Total sponsors :</span>
                          <span className="text-primary ml-1">
                            {sponsors.sponsors.length}
                          </span>
                        </p>
                      }
                      startContent={
                        <div className="p-3 w-12 h-12 rounded-xl bg-gradient-to-r bg-gray-200 border">
                          <span className="font-semibold text-gray-500">
                            {sponsors.priority ?? '-'}
                          </span>
                        </div>
                      }
                    >
                      <SponsorTable
                        isModalOpen={isModalOpen}
                        modalMode={modalMode}
                        selectedSponsor={selectedSponsor}
                        sponsorTypes={sponsorsType}
                        sponsors={sponsors.sponsors}
                        type={type}
                        onAdd={handleAdd}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        handleSubmit={handleSubmit}
                        onClose={() => setIsModalOpen(false)}
                      />

                      {sponsors.sponsors.length === 0 && !sponsorsLoading && (
                        <p className="text-center text-sm text-default-500">
                          No sponsors found. Please add a new sponsor.
                        </p>
                      )}
                    </AccordionItem>
                  );
                })
            )}
          </Accordion>
        </div>
      </div>

      <AddSponsorTypeModal
        isOpen={isTypeOpen}
        onClose={() => setIsTypeOpen(false)}
        onAddType={handleAddType}
        sponsorsType={sponsorsType}
      />

      <ConfirmationModal
        isOpen={confirmationModal}
        onClose={() => {
          setConfirmationModal(false);
          setSelectedSponsor(null);
        }}
        onConfirm={handleConfirm}
        title='Delete Sponsor'
        body={`Are you sure you want to delete the sponsor "${selectedSponsor?.name?.en}"?`}
        confirmText='Delete'
        confirmColor='danger'
      />
    </div>
  );
}

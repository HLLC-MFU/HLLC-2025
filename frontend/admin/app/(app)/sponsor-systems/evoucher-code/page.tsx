'use client';

import React, { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft, TicketCheck } from 'lucide-react';
import { useEvoucherCode } from '@/hooks/useEvoucherCode';
import { useSponsors } from '@/hooks/useSponsors';
import { useEvoucher } from '@/hooks/useEvoucher';
import EvoucherCodeAccordion from './_components/EvoucherCodeAccordion';
import { EvoucherCode } from '@/types/evoucher-code';
import {
  Accordion,
  AccordionItem,
  addToast,
  Button,
  Skeleton,
} from '@heroui/react';
import { EvoucherCodeModal } from './_components/EvoucherCodeModal';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { useRouter } from 'next/navigation';

export default function EvoucherCodePage() {
  const router = useRouter();
  const { createEvoucherCode, deleteEvoucherCode } = useEvoucherCode();
  const {
    sponsors,
    loading: sponsorsLoading,
    fetchEvoucherCodeBySponsorId: rawFetcher,
  } = useSponsors();
  const { evouchers, loading: evouchersLoading } = useEvoucher();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvoucherCode, setSelectedEvoucherCode] = useState<
    EvoucherCode | undefined
  >();
  const [confirmationModalType, setConfirmationModalType] = useState<
    'delete' | 'edit' | null
  >(null);
  const fetchEvoucherCodeBySponsorId = useCallback(
    async (sponsorId: string) => {
      const res = await rawFetcher(sponsorId);
      return res;
    },
    [rawFetcher],
  );

  const isLoading = sponsorsLoading || evouchersLoading;

  const handleAddEvoucherCode = () => {
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditEvoucherCode = (evoucherCode: EvoucherCode) => {
    setModalMode('edit');
    setSelectedEvoucherCode(evoucherCode);
    setIsModalOpen(true);
  };

  const handleDelete = (evoucherCode: EvoucherCode) => {
    setSelectedEvoucherCode(evoucherCode);
    setConfirmationModalType('delete');
  };

  const handleSubmitEvoucherCode = async (
    evoucherCodeData: Partial<EvoucherCode>,
  ) => {
    if (
      selectedEvoucherCode &&
      '_id' in selectedEvoucherCode &&
      selectedEvoucherCode._id
    ) {
      setSelectedEvoucherCode({ ...selectedEvoucherCode, ...evoucherCodeData });
      setConfirmationModalType('edit');
    } else {
      await createEvoucherCode(evoucherCodeData);
    }
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (
      confirmationModalType === 'delete' &&
      selectedEvoucherCode &&
      selectedEvoucherCode._id
    ) {
      await deleteEvoucherCode(selectedEvoucherCode._id);
      addToast({
        title: 'Evoucher code deleted successfully!',
        color: 'success',
      });
    }
    setConfirmationModalType(null);
    setSelectedEvoucherCode(undefined);
  };

  return (
    <>
      <PageHeader
        description="Manage evoucher codes"
        icon={<TicketCheck />}
        title="Evoucher Code"
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
        {isLoading ? (
          <Accordion className="p-0" variant="splitted">
            {Array.from({ length: 3 }).map((_, index) => (
              <AccordionItem
                key={`skeleton-${index}`}
                aria-label={`Loading ${index}`}
                title={
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                }
              >
                <Skeleton className="h-[100px] w-full bg-gray-100 rounded-md" />
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <EvoucherCodeAccordion
            sponsors={sponsors}
            evoucherCodes={fetchEvoucherCodeBySponsorId}
            onAdd={handleAddEvoucherCode}
            onEdit={handleEditEvoucherCode}
            onDelete={handleDelete}
          />
        )}
      </div>

      <EvoucherCodeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSuccess={handleSubmitEvoucherCode}
        mode={modalMode}
        evouchers={evouchers}
        evoucherCode={selectedEvoucherCode}
        sponsorId={sponsors[0]?._id}
      />

      <ConfirmationModal
        isOpen={confirmationModalType === 'delete'}
        onClose={() => {
          setConfirmationModalType(null);
          setSelectedEvoucherCode(undefined);
        }}
        onConfirm={handleConfirm}
        title={'Delete evoucher code'}
        body={'Are you sure you want to delete this Evoucher code?'}
        confirmColor="danger"
      />
    </>
  );
}

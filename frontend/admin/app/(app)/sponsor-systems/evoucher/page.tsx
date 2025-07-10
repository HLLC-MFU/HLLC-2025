'use client';

import { useMemo, useState } from "react";
import { Accordion, AccordionItem, addToast, Button, modal, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { useEvoucher } from "@/hooks/useEvoucher";
import { Evoucher } from "@/types/evoucher";
import { ArrowLeft, Globe, Ticket, User } from "lucide-react";
import EvoucherTable from "./_components/EvoucherTable";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherModal } from "./_components/EvoucherModal";
import { useSponsors } from "@/hooks/useSponsors";

export default function EvoucherPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedEvoucher, setSelectedEvoucher] = useState<Evoucher | null>(null);

  const {
    evouchers,
    loading: evoucherLoading,
    fetchEvouchers,
    createEvoucher,
    updateEvoucher,
    deleteEvoucher
  } = useEvoucher();

  const { sponsors, loading: sponsorsLoading } = useSponsors();

  const isLoading = evoucherLoading || sponsorsLoading;

  const groupedEvoucher = useMemo(() => {
    const groups: Record<string, Evoucher[]> = {};

    evouchers.forEach((evoucher) => {
      const evoucherType = (evoucher as Evoucher)?.metadata?.type ? 'global' : 'individual';

      if (!groups[evoucherType]) groups[evoucherType] = [];
      groups[evoucherType].push(evoucher);
    });

    return groups;
  }, [evouchers]);

  const handleAdd = () => {
    setModalMode('add');
    setSelectedEvoucher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (evoucher: Evoucher) => {
    setModalMode('edit');
    setSelectedEvoucher(evoucher);
    setIsModalOpen(true);
  };

  const handleDelete = (evoucher: Evoucher) => {
    setSelectedEvoucher(evoucher);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async (sponsorsData: FormData) => {
    let response;

    if (modalMode === 'add') {
      response = await createEvoucher(sponsorsData);
    } else if (modalMode === 'edit' && selectedEvoucher?._id) {
      response = await updateEvoucher(selectedEvoucher._id, sponsorsData);
    }

    console.log(response)

    if (response) {
      await fetchEvouchers();
      setIsModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedEvoucher?._id) return;

    await deleteEvoucher(selectedEvoucher._id);
    await fetchEvouchers();

    addToast({
      title: 'Success',
      description: 'Delete evoucher successfully.',
      color: 'success'
    })
    setSelectedEvoucher(null);
    setIsConfirmOpen(false)
  };

  return (
    <>
      <PageHeader
        description="Manage evouchers"
        icon={<Ticket />}
        title="Evoucher"
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
            Object.entries(groupedEvoucher)
              .map(([type, evouchers]) => {
                return (
                  <AccordionItem
                    key={type}
                    aria-label={type}
                    title={<span className="capitalize">{type}</span>}
                    subtitle={
                      <p className="flex">
                        Total {type} evouchers:{' '}
                        <span className="text-primary ml-1">{evouchers.length}</span>
                      </p>
                    }
                    startContent={
                      <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                        <span className="text-gray-500">{type === 'global' ? <Globe /> : <User />}</span>
                      </div>
                    }
                  >
                    <EvoucherTable
                      evouchers={evouchers}
                      onAdd={handleAdd}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </AccordionItem>
                )
              })
          )}
        </Accordion>

        <EvoucherModal
          isOpen={isModalOpen}
          mode={modalMode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvoucher(null);
          }}
          onSuccess={handleSubmit}
          sponsors={sponsors}
          evoucher={selectedEvoucher}
        />

        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false);
          }}
          onConfirm={handleConfirm}
          title={"Delete Evoucher"}
          body={`Are you sure you want to delete "${selectedEvoucher?.name?.en}" evoucher?`}
          confirmText='Delete'
          confirmColor='danger'
        />
      </div>
    </>
  );
}

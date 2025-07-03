'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft, TicketCheck } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  Button,
  Skeleton,
  Image,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEvoucher } from '@/hooks/useEvoucher';
import { useEvoucherCode } from '@/hooks/useEvoucherCode';
import { EvoucherCode } from '@/types/evoucher-code';
import EvoucherCodeTable from './_components/EvoucherCodeTable';
import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { Evoucher } from '@/types/evoucher';

export default function EvoucherCodePage() {
  const router = useRouter();
  const [addModal, setAddModal] = useState<boolean>(false);
  const { evouchers, loading: EvoucherLoading } = useEvoucher();
  const {
    evoucherCodes,
    loading: EvoucherCodeLoading,
    fetchEvoucherCodes,
    addEvoucherCode,
    addByRoleEvoucherCode,
  } = useEvoucherCode();
  const { users, loading: usersLoading } = useUsers();
  const { roles, loading: rolesLoading } = useRoles();

  const isLoading = EvoucherLoading || EvoucherCodeLoading || usersLoading || rolesLoading;

  const groupedEvoucherCodes = useMemo(() => {
    const groups: Record<string, EvoucherCode[]> = {};

    evoucherCodes.forEach((code) => {
      const evoucherId = (code.evoucher as Evoucher)?._id;
      if (!evoucherId) return;

      if (!groups[evoucherId]) groups[evoucherId] = [];
      groups[evoucherId].push(code);
    });

    return groups;
  }, [evoucherCodes]);

  const handleAddEvoucherCode = async (evoucherId: string, userId?: string, roleId?: string) => {
    let response;
    if (userId) {
      response = await addEvoucherCode(evoucherId, userId);
    }
    if (roleId) {
      response = await addByRoleEvoucherCode(evoucherId, roleId);
    }

    if (response) {
      await fetchEvoucherCodes()
      setAddModal(false)
    };
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

      <div className="fl                                                                                                                                                                                                        ex flex-col gap-6">
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
            Object.entries(groupedEvoucherCodes)
              .map(([evoucher, codes]) => {
                const evoucherName = evouchers.find((e) => e._id === evoucher)?.name.en!;
                const evoucherPhoto = evouchers.find((evoucher) => evoucher.name.en === evoucherName)?.photo.home;
                return (
                  <AccordionItem
                    key={evoucherName}
                    aria-label={evoucherName}
                    title={evoucherName}
                    subtitle={
                      <p className="flex">
                        <span>Total evoucher codes :</span>
                        <span className="text-primary ml-1">
                          {codes?.length}
                        </span>
                      </p>
                    }
                    startContent={
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucherPhoto}`}
                        className="h-12 w-12 rounded-md"
                      />
                    }
                  >
                    <EvoucherCodeTable
                      evoucherCodes={codes}
                      setAddModal={setAddModal}
                      handleAddEvoucherCode={handleAddEvoucherCode}
                      addModal={addModal}
                      roles={roles}
                      users={users}
                    />
                  </AccordionItem>
                );
              })
          )}
        </Accordion>
      </div>
    </>
  );
}

// 'use client';

// import React, { useState } from 'react';
// import { PageHeader } from '@/components/ui/page-header';
// import { ArrowLeft, Ticket } from 'lucide-react';
// import EvoucherAccordion from './_components/EvoucherAccordion';
// import { useEvoucher } from '@/hooks/useEvoucher';
// import { Evoucher, EvoucherType } from '@/types/evoucher';
// import {
//   Accordion,
//   AccordionItem,
//   addToast,
//   Button,
//   Skeleton,
// } from '@heroui/react';
// import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
// import { EvoucherModal } from './_components/EvoucherModal';
// import { useSponsors } from '@/hooks/useSponsors';
// import { useRouter } from 'next/navigation';

// export default function EvoucherPage() {
//   const router = useRouter();
//   const {
//     evouchers,
//     loading: evouchersLoading,
//     createEvoucher,
//     deleteEvoucher,
//     updateEvoucher,
//     fetchEvouchers,
//   } = useEvoucher();
//   const { sponsors } = useSponsors();
//   const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [confirmationModalType, setConfirmationModalType] = useState<
//     'delete' | 'edit' | null
//   >(null);
//   const [selectedEvoucher, setSelectedEvoucher] = useState<
//     Evoucher | Partial<Evoucher> | undefined
//   >();
//   const isLoading = evouchersLoading;

//   const handleAddEvoucher = (type?: EvoucherType) => {
//     setModalMode('add');
//     setSelectedEvoucher(type ? { type } : undefined);
//     setIsModalOpen(true);
//   };

//   const handleEditEvoucher = (evoucher: Evoucher) => {
//     setModalMode('edit');
//     setSelectedEvoucher(evoucher);
//     setIsModalOpen(true);
//   };

//   const handleDelete = (evoucher: Evoucher) => {
//     setSelectedEvoucher(evoucher);
//     setConfirmationModalType('delete');
//   };

//   const handleSubmitEvoucher = async (
//     formData: FormData,
//     mode: 'add' | 'edit',
//   ) => {
//     try {
//       if (
//         mode === 'edit' &&
//         selectedEvoucher &&
//         '_id' in selectedEvoucher &&
//         selectedEvoucher._id
//       ) {
//         await updateEvoucher(selectedEvoucher._id, formData);
//       } else if (mode === 'add') {
//         await createEvoucher(formData);
//       }

//       await fetchEvouchers();
//       addToast({
//         title: `Evoucher ${mode === 'add' ? 'added' : 'updated'} successfully!`,
//         color: 'success',
//       });
//     } catch (err) {
//       addToast({ title: 'Error while saving evoucher', color: 'danger' });
//     } finally {
//       setIsModalOpen(false);
//     }
//   };

//   const handleConfirm = async () => {
//     if (
//       confirmationModalType === 'delete' &&
//       selectedEvoucher &&
//       selectedEvoucher._id
//     ) {
//       await deleteEvoucher(selectedEvoucher._id);
//       await fetchEvouchers();
//       addToast({ title: 'Evoucher deleted successfully!', color: 'success' });
//     }
//     setConfirmationModalType(null);
//     setSelectedEvoucher(undefined);
//   };

//   return (
//     <>
//       <PageHeader
//         description="Manage evouchers"
//         icon={<Ticket />}
//         title="Evoucher"
//       />
//       <div className="flex items-center gap-4 w-full mx-auto mb-4">
//         <Button
//           variant="flat"
//           size="lg"
//           startContent={<ArrowLeft className="w-4 h-4" />}
//           onPress={() => router.back()}
//           className="hover:bg-gray-100 transition-colors mb-2"
//         >
//           Back
//         </Button>
//       </div>

//       <div className="flex flex-col gap-6">
//         {isLoading ? (
//           <Accordion className="p-0" variant="splitted">
//             {Array.from({ length: 3 }).map((_, index) => (
//               <AccordionItem
//                 key={`skeleton-${index}`}
//                 aria-label={`Loading ${index}`}
//                 title={
//                   <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
//                 }
//               >
//                 <Skeleton className="h-[100px] w-full bg-gray-100 rounded-md" />
//               </AccordionItem>
//             ))}
//           </Accordion>
//         ) : (
//           <EvoucherAccordion
//             evouchers={evouchers}
//             onAdd={handleAddEvoucher}
//             onEdit={handleEditEvoucher}
//             onDelete={handleDelete}
//           />
//         )}
//       </div>

//       <EvoucherModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={handleSubmitEvoucher}
//         mode={modalMode}
//         evoucherType={selectedEvoucher?.type ?? EvoucherType.GLOBAL}
//         sponsors={sponsors}
//         evoucher={
//           modalMode === 'edit' && selectedEvoucher && '_id' in selectedEvoucher
//             ? (selectedEvoucher as Evoucher)
//             : undefined
//         }
//       />

//       <ConfirmationModal
//         isOpen={confirmationModalType === 'delete'}
//         onClose={() => setConfirmationModalType(null)}
//         onConfirm={handleConfirm}
//         title="Delete evoucher"
//         body="Are you sure you want to delete this item?"
//         confirmColor="danger"
//       />
//     </>
//   );
// }

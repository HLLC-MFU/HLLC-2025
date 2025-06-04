"use client";

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import {
    ArrowLeft,
    Building2,
    GraduationCap,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';

import { ConfirmationModal } from '../../../../components/modal/ConfirmationModal';

import { SponsorModal } from '../_components/SponsorModal';
import { SponsorDetailSkeleton} from './components/SponsorDetailSkeleton';

import { useSponsor } from '@/hooks/useSponsor';
import { Sponsor } from '@/types/sponsor';

export default function SponsorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const { sponsor, loading, updateSponsor, deleteSponsor } = useSponsor();
    const sponsors = useMemo(
        () => sponsor.find((s) => s._id === id),
        [sponsor, id],
    );

    const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<
        Sponsor | Partial<Sponsor> | undefined
    >();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);

    const handleAddSponsor = () => {
        setModalMode('add');
        setSelectedSponsor(undefined);
        setIsSponsorModalOpen(true);
    };

    const handleEditSponsor = (sponsor: Sponsor) => {
        setModalMode('edit');
        setSelectedSponsor(sponsor);
        setIsSponsorModalOpen(true);
    };

    const handleDeleteSponsor = (sponsor: Sponsor) => {
        setSelectedSponsor(sponsor);
        setConfirmationModalType('delete');
    };

    const handleSaveSponsor = async (
        sponsorData: Partial<Sponsor>,
        mode: 'add' | 'edit',
    ) => {
        if (!sponsor) return;

        if (mode === 'edit') {
            setSelectedSponsor(sponsorData);
            setConfirmationModalType('edit');
        }
    };

    const handleConfirm = async () => {
        if (!sponsor || !selectedSponsor) return;

        setConfirmationModalType(null);
        setSelectedSponsor(undefined);

        if (confirmationModalType === 'delete' && selectedSponsor._id) {
            await deleteSponsor(sponsor._id, selectedSponsor._id);
        } else if (confirmationModalType === 'edit') {
            if (selectedSponsor._id) {
                await edit({

                });
            }
        }
    };

    if (loading) return <SponsorDetailSkeleton />;
    if (!sponsor) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-center text-lg">Sponsor not found</p>
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
                            {sponsors?.name?.en ?? 'Unnamed School'}
                        </h1>
                    </div>

                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card
                                className="w-12 h-12 flex items-center justify-center"
                                radius="md"
                            >
                                {school.acronym ?? 'N/A'}
                            </Card>
                            <div className="flex flex-col">
                                <p className="text-lg font-semibold">
                                    {school.name?.en ?? 'N/A'}
                                </p>
                                <p className="text-small text-default-500">
                                    {school.name?.th ?? 'N/A'}
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">
                                    {school.acronym ?? 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GraduationCap className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">
                                    {school.majors?.length ?? 0} Programs
                                </span>
                            </div>
                            <p className="text-sm text-default-500">
                                {school.detail?.en ?? 'No details available.'}
                            </p>
                        </CardBody>
                    </Card>

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Majors</h2>
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onPress={handleAddMajor}
                        >
                            Add Major
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(school.majors ?? []).map((major) => (
                            <Card
                                key={major._id ?? major.acronym}
                                isHoverable
                                className="h-full"
                            >
                                <CardHeader className="flex gap-3 p-4">
                                    <Card
                                        className="w-12 h-12 flex items-center justify-center"
                                        radius="md"
                                    >
                                        {major.acronym ?? 'N/A'}
                                    </Card>
                                    <div className="flex flex-col items-start min-w-0 text-start">
                                        <p className="text-lg font-semibold truncate w-full">
                                            {major.name?.en ?? 'N/A'}
                                        </p>
                                        <p className="text-small text-default-500 truncate w-full">
                                            {major.name?.th ?? 'N/A'}
                                        </p>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="gap-4 p-4">
                                    <p className="text-sm text-default-500 line-clamp-2">
                                        {major.detail?.en ?? 'No details available.'}
                                    </p>
                                </CardBody>
                                <Divider />
                                <CardBody className="flex justify-end p-4">
                                    <div className="flex gap-2">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleEditMajor(major)}
                                        >
                                            <Pencil size={16} />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            color="danger"
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleDeleteMajor(major)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <MajorModal
                isOpen={isMajorModalOpen}
                major={selectedMajor as Major}
                mode={modalMode}
                school={school._id}
                onClose={() => setIsMajorModalOpen(false)}
                onSuccess={handleSaveMajor}
            />

            <ConfirmationModal
                body={
                    confirmationModalType === 'edit'
                        ? `Are you sure you want to save the changes for "${selectedMajor?.name?.en}"?`
                        : `Are you sure you want to delete the major "${selectedMajor?.name?.en}"? This action cannot be undone.`
                }
                confirmColor={confirmationModalType === 'edit' ? 'primary' : 'danger'}
                confirmText={confirmationModalType === 'edit' ? 'Save' : 'Delete'}
                isOpen={confirmationModalType !== null}
                title={confirmationModalType === 'edit' ? 'Save Major' : 'Delete Major'}
                onClose={() => {
                    setConfirmationModalType(null);
                    setSelectedMajor(undefined);
                }}
                onConfirm={handleConfirm}
            />
        </div>
    );
}

// import { Sponsor } from "@/types/sponsor";
// import { Button } from "@heroui/button";
// import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
// import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// const MOCK_SPONSORS: Sponsor[] = [
//     {
//         _id: "s1",
//         name: { en: "Google", th: "กูเกิล" },
//         description: {
//             en: "Google description",
//             th: "คำอธิบาย"
//         },
//         logo: { first: "", second: "", third: "", fourth: "" },
//         type: "Tech",
//         isShow: true
//     },
//     {
//         _id: "s2",
//         name: { en: "Facebook", th: "เฟสสะบุ้ค" },
//         description: {
//             en: "Facebook description",
//             th: "คำอธิบาย"
//         },
//         logo: { first: "", second: "", third: "", fourth: "" },
//         type: "Commu",
//         isShow: false
//     }
// ];

// export default function SponsorDetailPage() {
//     const { id } = useParams();
//     const router = useRouter();
//     const [sponsor, setSponsor] = useState<Sponsor | null>(null);

//     useEffect(() => {
//         const found = MOCK_SPONSORS.find((s) => s._id === id);
//         setSponsor(found ?? null);
//     }, [id]);

//     return (
//         <div className="flex flex-cols min-h-screen">
//             <div className="container mx-auto px-4">
//                 <div className="flex flex-col gap-6">
//                     <div className="flex itmes-center gap-4">
//                         <Button variant="flat" startContent={<ArrowLeft />} onPress={() => router.back()}>
//                             Back
//                         </Button>
//                         <h1 className="text-2xl font-bold">{sponsor?.name.en ?? "Unnamed Sponsor"}</h1>
//                     </div>

//                     <Card>
//                         <CardHeader className="flex gap-3 p-4">
//                             <Card radius="md" className="w-12 h-12 flex items-center justify-center">
//                                 {sponsor?.name.en ?? "N/A"}
//                             </Card>
//                             <div className="flex flex-col">
//                                 <p className="text-lg font-semibold">{sponsor?.name.en ?? "N/A"}</p>
//                                 <p className="text-small text-default-500">{sponsor?.name.th ?? "N/A"}</p>
//                             </div>
//                         </CardHeader>
//                         <Divider />
//                         <CardBody className="gap-4 p-4">
//                             <div className="flex items-center gap-2">
//                                 <Building2 className="text-default-500" size={16} />
//                                 <span className="text-sm text-default-500">{sponsor?.name.en ?? "N/A"}</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <GraduationCap className="text-default-500" size={16} />
//                                 <span className="text-sm text-default-500">{sponsor?.name.en ?? "N/A"} Programs</span>
//                             </div>
//                             <p className="text-sm text-default-500">{sponsor?.description.en ?? "No details available."}</p>
//                         </CardBody>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     );
// }
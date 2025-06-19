'use client'

import { useSchoolByInterfaces } from "@/hooks/useSchoolByInterfaces";
import { useParams, useRouter } from "next/navigation";
import { SchoolSkeleton } from "../_components/SchoolSkeleton";
import { Button, Card, CardBody } from "@heroui/react";
import { ArrowLeft, Image, MonitorSmartphone, PanelBottomDashed, PanelTopDashed } from 'lucide-react'
import { PageHeader } from "@/components/ui/page-header";
import useInterfaces from "@/hooks/useInterfaces";
import AssetsSection from "./_components/AssetsSection";

const topBar = [
    { title: "Step Tracking" },
    { title: "Notification" },
    { title: "Profile" },
]

const navBar = [
    { title: "Home" },
    { title: "Activities" },
    { title: "QRCode" },
    { title: "EVoucher" },
    { title: "Community" },
];

export default function InterfacesDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { interfaces, loading, fetchSchoolInterfaces } = useSchoolByInterfaces(id);
    const { updateInterfaces } = useInterfaces();

    const handleSave = async (interfaceData: FormData) => {
        if (interfaces) updateInterfaces(interfaces?._id, interfaceData);
        await fetchSchoolInterfaces();
    };

    if (loading) return <SchoolSkeleton />;

    if (!interfaces && !loading) {
        return (
            <div className="flex items-center justify-center min-h-full">
                <Card className="p-8 max-w-md shadow-xl">
                    <CardBody className="text-center">
                        <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-gray-700">School not found</h2>
                        <p className="text-gray-600 mb-4">The interface you're looking for doesn't exist.</p>
                        <Button
                            className="mt-4"
                            color="primary"
                            onPress={() => router.back()}
                        >
                            Go Back
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <PageHeader title={interfaces?.school.name.en} description={`Manage user interfaces for ${interfaces?.school.name.en}.`} icon={<MonitorSmartphone />} />
            <div className="flex items-center gap-4 w-full mx-auto mb-4">
                <Button
                    variant="flat"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => router.back()}
                    className="hover:bg-gray-100 transition-colors"
                >
                    Back
                </Button>
            </div>

            <div className="w-full mx-auto">
                {interfaces && (
                    <>
                        <AssetsSection
                            icon={<PanelTopDashed />}
                            title={"Top Header Assets"}
                            description={"Top header bar icons"}
                            item={topBar}
                            interfaces={interfaces}
                            onSave={handleSave}
                        />
                        <AssetsSection
                            icon={<PanelBottomDashed />}
                            title={"Navigation Bar Assets"}
                            description={"Navigation bar icons"}
                            item={navBar}
                            interfaces={interfaces}
                            onSave={handleSave}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
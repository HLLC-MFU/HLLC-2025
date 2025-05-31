'use client';

import { useParams, useRouter } from 'next/navigation';
import { SchoolDetailSkeleton } from '../../schools/[id]/_components/SchoolDetailSkeleton';
import { useSchoolByAppearance } from '@/hooks/useSchoolByAppearance';
import { Card, CardBody } from '@heroui/react';
import { AlertCircle, Image } from 'lucide-react';
import { Button } from '@heroui/button';
import { AppearanceHeader } from './_components/AppearanceHeader';
import { BackgroundSection } from './_components/BackgroundSection';
import { AssetsSection } from './_components/AssetsSection';
import { ColorsSection } from './_components/ColorsSection';
import { PreviewSection } from './_components/PreviewSection';
import { useAppearanceAssets } from '@/hooks/useAppearanceAssets';
import { useAppearanceColors } from '@/hooks/useAppearanceColors';
import { useState } from 'react';
import { DeleteConfirmationModal } from './_components/DeleteConfirmationModal';
import { UpdateConfirmationModal } from './_components/UpdateConfirmationModal';
import { apiRequest } from '@/utils/api';
import { Appearance } from '@/types/appearance';

export default function AppearanceDetailsPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { appearance, loading, error, setAppearance } = useSchoolByAppearance(id);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedAppearance, setSelectedAppearance] = useState<Appearance | undefined>();

    const {
        assetDrafts,
        uploadingAssets,
        savedAssets,
        previewUrls,
        handleFileChange,
        handleSaveAsset,
    } = useAppearanceAssets({ 
        appearance,
        onAppearanceUpdate: (updatedAppearance) => {
            setAppearance(updatedAppearance);
        }
    });

    const {
        colorDrafts,
        handleColorChange,
        handleSaveColors,
    } = useAppearanceColors({ appearance });

    const handleConfirmDelete = async () => {
        if (!selectedAppearance || !appearance) return;
        try {
            await apiRequest(`/appearances/${selectedAppearance._id}`, "DELETE");
            setAppearance(null);
            setIsDeleteModalOpen(false);
            setSelectedAppearance(undefined);
        } catch (error) {
            console.error("Error deleting appearance:", error);
        }
    };

    const handleConfirmUpdate = async () => {
        if (!appearance) return;
        try {
            const updatedAppearance = await handleSaveColors();
            if (updatedAppearance) {
                setAppearance(updatedAppearance);
            }
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (loading) return <SchoolDetailSkeleton />;
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
                <Card className="p-8 max-w-md shadow-xl">
                    <CardBody className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-red-700">Something went wrong</h2>
                        <p className="text-red-600">{error}</p>
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

    if (!appearance && !loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                <Card className="p-8 max-w-md shadow-xl">
                    <CardBody className="text-center">
                        <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-gray-700">School not found</h2>
                        <p className="text-gray-600 mb-4">The appearance you're looking for doesn't exist.</p>
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
        <div className="min-h-screen">
            {appearance && <AppearanceHeader appearance={appearance} />}

            <div className="container mx-auto px-6 py-8">
                <div className="grid gap-8 max-w-6xl mx-auto">
                    {appearance && (
                        <>
                            <BackgroundSection
                                appearance={appearance}
                                previewUrls={previewUrls}
                                assetDrafts={assetDrafts}
                                uploadingAssets={uploadingAssets}
                                savedAssets={savedAssets}
                                onFileChange={handleFileChange}
                                onSaveAsset={handleSaveAsset}
                            />

                            <AssetsSection
                                appearance={appearance}
                                previewUrls={previewUrls}
                                assetDrafts={assetDrafts}
                                uploadingAssets={uploadingAssets}
                                savedAssets={savedAssets}
                                onFileChange={handleFileChange}
                                onSaveAsset={handleSaveAsset}
                            />

                            <ColorsSection
                                colorDrafts={colorDrafts}
                                onColorChange={handleColorChange}
                                onSaveColors={() => setIsUpdateModalOpen(true)}
                            />

                            <PreviewSection
                                appearance={appearance}
                                colorDrafts={colorDrafts}
                            />
                        </>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                appearance={selectedAppearance}
            />

            <UpdateConfirmationModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onConfirm={handleConfirmUpdate}
                appearance={selectedAppearance}
            />
        </div>
    );
}
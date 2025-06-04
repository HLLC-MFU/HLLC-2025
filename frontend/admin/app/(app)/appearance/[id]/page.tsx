'use client';

import { useParams, useRouter } from 'next/navigation';
import { SchoolDetailSkeleton } from '../../schools/[id]/_components/SchoolDetailSkeleton';
import { useSchoolByAppearance } from '@/hooks/useSchoolByAppearance';
import { addToast, Card, CardBody } from '@heroui/react';
import { AlertCircle, Image } from 'lucide-react';
import { Button } from '@heroui/button';
import { AppearanceHeader } from './_components/AppearanceHeader';
import { AssetsSection } from './_components/AssetsSection';
import { ColorsSection } from './_components/ColorsSection';
import { PreviewSection } from './_components/PreviewSection';
import { useAppearanceAssets } from '@/hooks/useAppearanceAssets';
import { useAppearanceColors } from '@/hooks/useAppearanceColors';
import { useState } from 'react';
import { ColorConfirmationModal } from './_components/ColorConfirmationModal';
import { AssetsConfirmationModal } from './_components/AssetsConfirmationModal';
import { AppearanceSkeleton } from './_components/AppearanceSkeleton';

export default function AppearanceDetailsPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { appearance, loading, error, setAppearance } = useSchoolByAppearance(id);
    const [isConfirmColorModalOpen, setIsConfirmColorModalOpen] = useState(false);
    const [isAssetSaveModalOpen, setIsAssetSaveModalOpen] = useState(false);
    const [pendingAssetKey, setPendingAssetKey] = useState<string | null>(null);
    const [isAssetSaveAllModalOpen, setIsAssetSaveAllModalOpen] = useState(false);

    const {
        assetDrafts,
        uploadingAssets,
        savedAssets,
        previewUrls,
        handleFileChange,
        handleSaveAsset,
        handleCancelAsset,
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


    const handleConfirmUpdate = async () => {
        if (!appearance) return;
        try {
            const updatedAppearance = await handleSaveColors();
            if (updatedAppearance) {
                setAppearance(updatedAppearance);
            }
            setIsConfirmColorModalOpen(false);
            addToast({
                title: "Appearance updated successfully",
                color: "success",
            });
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleRequestSaveAll = () => {
        setIsAssetSaveAllModalOpen(true);
    };

    const handleConfirmAssetSave = async () => {
        if (pendingAssetKey) {
            const updatedAppearance = await handleSaveAsset(pendingAssetKey);
            if (updatedAppearance) {
                setAppearance(updatedAppearance);
            } else {
                addToast({
                    title: "Failed to update appearance. Please try again.",
                    color: "danger",
                });
            }
            setIsAssetSaveModalOpen(false);
            setPendingAssetKey(null);
        }
    };

    const handleConfirmAssetSaveAll = async () => {
        let anyFailed = false;
        for (const key of Object.keys(assetDrafts)) {
            if (assetDrafts[key]) {
                const updatedAppearance = await handleSaveAsset(key);
                if (!updatedAppearance) {
                    anyFailed = true;
                } else {
                    setAppearance(updatedAppearance);
                }
            }
        }
        setIsAssetSaveAllModalOpen(false);
        if (anyFailed) {
            addToast({
                title: "Some assets failed to save. Please try again.",
                color: "danger",
            });
        }
    };

    if (loading) return <SchoolDetailSkeleton />;

    if (error) {
        return (
            <AppearanceSkeleton/>
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
        <div className="h-screen">
            {appearance && <AppearanceHeader appearance={appearance} />}

            <div className="container mx-auto px-6 py-8">
                <div className="grid gap-8 w-full mx-auto">
                    {appearance && (
                        <>
                            <AssetsSection
                                appearance={appearance}
                                previewUrls={previewUrls}
                                assetDrafts={assetDrafts}
                                uploadingAssets={uploadingAssets}
                                savedAssets={savedAssets}
                                onFileChange={handleFileChange}
                                onSaveAsset={handleSaveAsset}
                                onCancel={handleCancelAsset}
                                onRequestSaveAll={handleRequestSaveAll}
                            />

                            <ColorsSection
                                colorDrafts={colorDrafts}
                                onColorChange={handleColorChange}
                                onSaveColors={() => setIsConfirmColorModalOpen(true)}
                            />

                            <PreviewSection
                                appearance={appearance}
                                colorDrafts={colorDrafts}
                            />
                        </>
                    )}
                </div>
            </div>

            <ColorConfirmationModal
                isOpen={isConfirmColorModalOpen}
                onClose={() => setIsConfirmColorModalOpen(false)}
                onConfirm={handleConfirmUpdate}
            />

            <AssetsConfirmationModal
                isOpen={isAssetSaveModalOpen}
                onClose={() => setIsAssetSaveModalOpen(false)}
                onConfirm={handleConfirmAssetSave}
            />

            <AssetsConfirmationModal
                isOpen={isAssetSaveAllModalOpen}
                onClose={() => setIsAssetSaveAllModalOpen(false)}
                onConfirm={handleConfirmAssetSaveAll}
            />
        </div>
    );
}
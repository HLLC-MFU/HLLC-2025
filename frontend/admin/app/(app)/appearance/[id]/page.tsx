'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Palette } from 'lucide-react';
import { Button } from '@heroui/button';
import { ColorsSection } from './_components/ColorsSection';
import { PreviewSection } from './_components/PreviewSection';
import { useState } from 'react';
import { ConfirmationModal } from './_components/ConfirmationModal';
import { AppearanceSkeleton } from './_components/AppearanceSkeleton';
import { PageHeader } from '@/components/ui/page-header';
import AssetsSection from './_components/AssetsSection';
import { useSchools } from '@/hooks/useSchool';
import useAppearance from '@/hooks/useAppearance';

const uiSection = {
  background: [{ title: 'Background' }],
  header: [
    { title: 'Progress' },
    { title: 'Notification' },
    { title: 'Profile' },
  ],
  navigation: [
    { title: 'Home' },
    { title: 'Activities' },
    { title: 'QRCode' },
    { title: 'EVoucher' },
    { title: 'Community' },
  ],
};

export default function AppearanceDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isColorSaveModalOpen, setIsColorSaveModalOpen] = useState<boolean>(false);
  const [isAssetSaveModalOpen, setIsAssetSaveModalOpen] = useState<boolean>(false);

  const { appearance, loading, error, fetchAppearance } = useSchools(id);

  const {
    colors,
    assets,
    setError,
    setAssets,
    handleSaveColor,
    handleSaveAsset,
  } = useAppearance({ appearance });

  const handleConfirmColor = async () => {
    if (!appearance) return;
    try {
      await handleSaveColor();
      setIsColorSaveModalOpen(false);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to save color.'
          : 'Failed to save color.',
      );
    }
  };

  const handleConfirmAsset = async () => {
    if (!appearance) return;
    try {
      const res = await handleSaveAsset();

      setIsAssetSaveModalOpen(false);
      if (res) await fetchAppearance(id);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to save asset.'
          : 'Failed to save asset.',
      );
    }
  };

  if (loading || error || !appearance) return <AppearanceSkeleton />;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={appearance.school.name.en}
        description={`Manage user appearance for ${appearance?.school.name.en}.`}
        icon={<Palette />}
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

      <div className="w-full mx-auto">
        <div className="grid gap-8 w-full mx-auto">
          {appearance && (
            <>
              <AssetsSection
                uiSection={uiSection}
                assets={assets}
                appearance={appearance}
                onSetAssets={setAssets}
                onSave={() => setIsAssetSaveModalOpen(true)}
              />

              <ColorsSection
                colors={colors}
                onSave={() => setIsColorSaveModalOpen(true)}
              />

              <PreviewSection appearance={appearance} colors={colors} />
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        title="Confirm Change Colors"
        subtitle="Are you sure you want to save the changes to the colors?"
        isOpen={isColorSaveModalOpen}
        onClose={() => setIsColorSaveModalOpen(false)}
        onConfirm={handleConfirmColor}
      />

      <ConfirmationModal
        title="Confirm Change Assets"
        subtitle="Are you sure you want to save the changes to the assets?"
        isOpen={isAssetSaveModalOpen}
        onClose={() => setIsAssetSaveModalOpen(false)}
        onConfirm={handleConfirmAsset}
      />
    </div>
  );
}

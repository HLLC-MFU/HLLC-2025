import { useState, useEffect } from 'react';
import { Appearance } from '@/types/appearance';
import { addToast } from '@heroui/react';

interface UseAppearanceAssetsProps {
    appearance: Appearance | null;
    onAppearanceUpdate?: (updatedAppearance: Appearance) => void;
}

export function useAppearanceAssets({ appearance, onAppearanceUpdate }: UseAppearanceAssetsProps) {
    const [assetDrafts, setAssetDrafts] = useState<Record<string, File | null>>({});
    const [uploadingAssets, setUploadingAssets] = useState<Record<string, boolean>>({});
    const [savedAssets, setSavedAssets] = useState<Record<string, boolean>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

    const handleFileChange = (key: string, file: File) => {
        const url = URL.createObjectURL(file);
        setAssetDrafts(prev => ({ ...prev, [key]: file }));
        setPreviewUrls(prev => ({ ...prev, [key]: url }));
    };

    const handleSaveAsset = async (key: string) => {
        if (!appearance) return;

        setUploadingAssets(prev => ({ ...prev, [key]: true }));
        try {
            const formData = new FormData();

            Object.entries(appearance.assets).forEach(([assetKey, value]) => {
                if (assetKey === key && assetDrafts[key]) {
                    formData.append(`assets[${assetKey}]`, assetDrafts[key]!);
                } else {
                    formData.append(`assets[${assetKey}]`, value);
                }
            });

            const res = await fetch(`http://localhost:8080/api/appearances/${appearance._id}`, {
                method: "PATCH",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${text}`);
            }

            const json = await res.json();
            const updatedAppearance = json.data;

            if (onAppearanceUpdate) {
                onAppearanceUpdate(updatedAppearance);
            }

            setSavedAssets(prev => ({ ...prev, [key]: true }));
            setAssetDrafts(prev => ({ ...prev, [key]: null }));
            setPreviewUrls(prev => {
                const updated = { ...prev };
                URL.revokeObjectURL(prev[key]);
                delete updated[key];
                return updated;
            });

            addToast({
                title: "Asset updated successfully",
                color: "success",
            });

            setTimeout(() => {
                setSavedAssets(prev => ({ ...prev, [key]: false }));
            }, 2000);

            return updatedAppearance;
        } catch (err) {
            console.error(`Error saving ${key}:`, err);
            throw err;
        } finally {
            setUploadingAssets(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleCancelAsset = (key: string) => {
        setAssetDrafts(prev => ({ ...prev, [key]: null }));
        setSavedAssets(prev => ({ ...prev, [key]: false }));

        setPreviewUrls(prev => {
            const updated = { ...prev };
            const url = updated[key];
            if (url) {
                URL.revokeObjectURL(url);
                delete updated[key];
            }

            return updated;
        });
    };


    useEffect(() => {
        if (!appearance?.assets) return;

        const keys = Object.keys(appearance.assets);
        const draftInit: Record<string, File | null> = {};
        const uploadingInit: Record<string, boolean> = {};
        const savedInit: Record<string, boolean> = {};

        keys.forEach(k => {
            draftInit[k] = null;
            uploadingInit[k] = false;
            savedInit[k] = false;
        });

        setAssetDrafts(draftInit);
        setUploadingAssets(uploadingInit);
        setSavedAssets(savedInit);
    }, [appearance?.assets]);

    useEffect(() => {
        return () => {
            Object.values(previewUrls).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [previewUrls]);

    return {
        assetDrafts,
        uploadingAssets,
        savedAssets,
        previewUrls,
        handleFileChange,
        handleSaveAsset,
        handleCancelAsset,
    };
}

import { useState, useEffect } from 'react';
import { Appearance } from '@/types/appearance';

interface UseAppearanceAssetsProps {
    appearance: Appearance | null;
    onAppearanceUpdate?: (updatedAppearance: Appearance) => void;
}

export function useAppearanceAssets({ appearance, onAppearanceUpdate }: UseAppearanceAssetsProps) {
    const [assetDrafts, setAssetDrafts] = useState<Record<string, File | null>>({
        background: null,
        backpack: null,
        appearance: null,
    });
    const [uploadingAssets, setUploadingAssets] = useState<Record<string, boolean>>({});
    const [savedAssets, setSavedAssets] = useState<Record<string, boolean>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

    const handleFileChange = (key: string, file: File) => {
        setAssetDrafts(prev => ({ ...prev, [key]: file }));
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [key]: url }));
    };

    const handleSaveAsset = async (key: string) => {
        if (!appearance) return;
        
        setUploadingAssets(prev => ({ ...prev, [key]: true }));
        try {
            const formData = new FormData();
            
            // Add all assets to formData, keeping existing values for unchanged assets
            Object.entries(appearance.assets).forEach(([assetKey, value]) => {
                if (assetKey === key && assetDrafts[key]) {
                    // Use new value for the asset being updated
                    formData.append(`assets[${assetKey}]`, assetDrafts[key]!);
                } else {
                    // Keep existing value for other assets
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
            
            // Update appearance state if callback is provided
            if (onAppearanceUpdate) {
                onAppearanceUpdate(updatedAppearance);
            }
            
            // Show success state for the updated asset
            setSavedAssets(prev => ({ ...prev, [key]: true }));
            
            // Clear draft for the updated asset
            setAssetDrafts(prev => ({ ...prev, [key]: null }));
            
            // Clear preview URL for the updated asset
            setPreviewUrls(prev => {
                const newUrls = { ...prev };
                delete newUrls[key];
                return newUrls;
            });
            
            // Hide success state after 2 seconds
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

    useEffect(() => {
        // Cleanup preview URLs
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
    };
} 
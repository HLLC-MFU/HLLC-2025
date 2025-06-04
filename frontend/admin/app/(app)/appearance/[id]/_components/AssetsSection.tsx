import { createRef, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { CheckCircle, Upload, Image, Save } from 'lucide-react';
import { Appearance } from '@/types/appearance';

interface AssetsSectionProps {
    appearance: Appearance;
    previewUrls: Record<string, string>;
    assetDrafts: Record<string, File | null>;
    uploadingAssets: Record<string, boolean>;
    savedAssets: Record<string, boolean>;
    onFileChange: (key: string, file: File) => void;
    onSaveAsset: (key: string) => void;
    onCancel: (key: string) => void;
    onRequestSaveAll: () => void;
}

export function AssetsSection({
    appearance,
    previewUrls,
    assetDrafts,
    savedAssets,
    onFileChange,
    onSaveAsset,
    onCancel,
    onRequestSaveAll,
}: AssetsSectionProps) {
    const assetKeys = Object.keys(appearance.assets);

    const fileInputRefs = useMemo(() => {
        const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {};
        assetKeys.forEach((key) => {
            refs[key] = createRef<HTMLInputElement>();
        });
        return refs;
    }, [assetKeys]);

    const hasUnsavedAssets = useMemo(() => {
        return Object.values(assetDrafts).some(file => file !== null);
    }, [assetDrafts]);

    const backgroundKey = assetKeys.find(key => key.toLowerCase() === 'background');
    const otherAssetKeys = assetKeys.filter(key => key.toLowerCase() !== 'background');

    return (
        <>
            {/* Card for Background asset */}
            {backgroundKey && (
                <Card className="mb-8">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                <Image className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex flex-col items-start">
                                <h2 className="text-xl font-semibold">Background</h2>
                                <p className="text-sm">Main background image</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="mb-6">
                            <div className="space-y-3">
                                <div className="relative group">
                                    <label htmlFor={`upload-${backgroundKey}`} className="cursor-pointer block">
                                        <div className="overflow-hidden rounded-lg">
                                            <img
                                                src={previewUrls[backgroundKey] || `http://localhost:8080/uploads/${appearance.assets[backgroundKey]}`}
                                                alt={backgroundKey}
                                                className="w-full max-w-xl h-full mx-auto object-cover  rounded-lg flex items-center justify-center overflow-hidden object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center rounded-lg">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center">
                                                    <Upload className="w-6 h-6 text-white mb-1" />
                                                    <p className="text-white text-xs font-medium">Upload new background</p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        id={`upload-${backgroundKey}`}
                                        ref={fileInputRefs[backgroundKey]!}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onFileChange(backgroundKey, file);
                                        }}
                                        className="hidden"
                                    />
                                </div>
                                <h3 className="text-base font-semibold capitalize text-center">{backgroundKey}</h3>
                                {savedAssets[backgroundKey] && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-md justify-center">
                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                        <span className="font-medium">Saved!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Card for other assets */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                            <Image className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex flex-col items-start">
                            <h2 className="text-xl font-semibold">School Assets</h2>
                            <p className="text-sm">Logo, icons and visual elements</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {otherAssetKeys.map((key) => (
                            <div key={key} className="space-y-3">
                                <div className="relative group">
                                    <label htmlFor={`upload-${key}`} className="cursor-pointer block">
                                        <div className="relative overflow-hidden rounded-lg hover:border-gray-300 transition-all duration-300 group-hover:shadow-md">
                                            <img
                                                src={previewUrls[key] || `http://localhost:8080/uploads/${appearance.assets[key]}`}
                                                alt={key}
                                                className="aspect-square w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center">
                                                    <Upload className="w-5 h-5 text-white mb-1" />
                                                    <p className="text-white text-xs font-medium">Upload new {key}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        id={`upload-${key}`}
                                        ref={fileInputRefs[key]}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onFileChange(key, file);
                                        }}
                                        className="hidden"
                                    />
                                </div>
                                <h3 className="text-sm font-medium capitalize text-center">{key}</h3>
                                {savedAssets[key] && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-md">
                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                        <span className="font-medium">Saved!</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex gap-3 justify-end">
                        <Button
                            color="primary"
                            size="md"
                            variant='light'
                            disabled={!hasUnsavedAssets}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                            onPress={onRequestSaveAll}
                        >
                            <span className="flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save All
                            </span>
                        </Button>

                        <Button
                            color="danger"
                            variant="light"
                            size="md"
                            disabled={!hasUnsavedAssets}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                            onPress={() => {
                                assetKeys.forEach((key) => {
                                    onCancel(key);
                                    const input = fileInputRefs[key]?.current;
                                    if (input) input.value = '';
                                });
                            }}
                        >
                            Cancel All
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </>
    );
}
import { createRef, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { CheckCircle, Upload, Image } from 'lucide-react';
import { Appearance } from '@/types/appearance';

interface AssetsSectionProps {
    appearance: Appearance;
    previewUrls: Record<string, string>;
    assetDrafts: Record<string, File | null>;
    uploadingAssets: Record<string, boolean>;
    savedAssets: Record<string, boolean>;
    onFileChange: (key: string, file: File) => void;
    onSaveAsset: (key: string) => void;
}

export function AssetsSection({
    appearance,
    previewUrls,
    assetDrafts,
    uploadingAssets,
    savedAssets,
    onFileChange,
    onSaveAsset,
}: AssetsSectionProps) {
    const assetKeys = Object.keys(appearance.assets).filter(key => key !== 'background');


    const fileInputRefs = useMemo(() => {
        const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {};
        assetKeys.forEach((key) => {
            refs[key] = createRef<HTMLInputElement>();
        });
        return refs;
    }, [assetKeys]);

    const handleTriggerUpload = (key: string) => {
        fileInputRefs[key]?.current?.click();
    };

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start">
                        <h2 className="text-xl font-semibold">School Assets</h2>
                        <p className="text-sm">Logo, icons and visual elements</p>
                    </div>
                </div>
            </CardHeader>

            <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {assetKeys.map((key) => (
                        <div key={key} className="space-y-4">
                            <h3 className="font-semibold capitalize text-lg">{key}</h3>

                            <div className="relative max-w-xs mx-auto">
                                <label htmlFor={`upload-${key}`} className="cursor-pointer block">
                                    <img
                                        src={
                                            previewUrls[key] ||
                                            `http://localhost:8080/uploads/${appearance.assets[key]}`
                                        }
                                        alt={key}
                                        className="w-full rounded-xl shadow-lg"
                                    />
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

                            <div className="space-y-3">
                                {assetDrafts[key] && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>📁 {assetDrafts[key]!.name}</span>
                                        </div>
                                        <Button
                                            color="success"
                                            size="sm"
                                            className="w-full text-sm"
                                            isLoading={uploadingAssets[key]}
                                            onPress={() => onSaveAsset(key)}
                                        >
                                            {uploadingAssets[key] ? 'Uploading...' : `Save ${key}`}
                                        </Button>
                                    </>
                                )}

                                {savedAssets[key] && (
                                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>{key} saved successfully!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { CheckCircle, Image, Upload } from 'lucide-react';
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
    onSaveAsset
}: AssetsSectionProps) {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6" />
                    </div>
                    <div className='flex flex-col items-start'>
                        <h2 className="text-xl font-semibold">School Assets</h2>
                        <p className="text-sm">Logo, icons and visual elements</p>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {["backpack", "appearance"].map((key) => (
                        <div key={key} className="space-y-4">
                            <h3 className="font-semibold capitalize text-lg">{key}</h3>
                            <div className="relative group">
                                <img
                                    src={previewUrls[key] || `http://localhost:8080/uploads/${appearance?.assets[key]}`}
                                    alt={key}
                                    className="w-full max-w-[200px] mx-auto rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onFileChange(key, file);
                                        }}
                                        className="hidden"
                                        id={`${key}-upload`}
                                    />
                                    <label
                                        htmlFor={`${key}-upload`}
                                        className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer text-sm"
                                    >
                                        <Upload className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Choose {key}</span>
                                    </label>
                                </div>

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
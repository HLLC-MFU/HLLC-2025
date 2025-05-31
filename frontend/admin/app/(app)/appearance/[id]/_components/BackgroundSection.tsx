import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { CheckCircle, Eye, Image, Upload } from 'lucide-react';
import { Appearance } from '@/types/appearance';

interface BackgroundSectionProps {
    appearance: Appearance;
    previewUrls: Record<string, string>;
    assetDrafts: Record<string, File | null>;
    uploadingAssets: Record<string, boolean>;
    savedAssets: Record<string, boolean>;
    onFileChange: (key: string, file: File) => void;
    onSaveAsset: (key: string) => void;
}

export function BackgroundSection({
    appearance,
    previewUrls,
    assetDrafts,
    uploadingAssets,
    savedAssets,
    onFileChange,
    onSaveAsset
}: BackgroundSectionProps) {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6" />
                    </div>
                    <div className='flex flex-col items-start p-2'>
                        <h2 className="text-xl font-semibold">Background Image</h2>
                        <p className="text-sm">Main background for your school interface</p>
                    </div>
                </div>
            </CardHeader>
            <CardBody>
                <div className="flex flex-col gap-6 items-center">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <img
                                src={previewUrls.background || `http://localhost:8080/uploads/${appearance?.assets.background}`}
                                alt="background"
                                className="w-full rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300 flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onFileChange('background', file);
                                }}
                                className="hidden"
                                id="background-upload"
                            />
                            <label
                                htmlFor="background-upload"
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-black-100 transition-colors cursor-pointer"
                            >
                                <Upload className="w-5 h-5" />
                                <span className="font-medium">Choose new background</span>
                            </label>

                            {assetDrafts.background && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>📁 {assetDrafts.background.name}</span>
                                    </div>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="w-full font-medium"
                                        isLoading={uploadingAssets.background}
                                        onPress={() => onSaveAsset('background')}
                                    >
                                        {uploadingAssets.background ? 'Uploading...' : 'Save Background'}
                                    </Button>
                                </div>
                            )}
                        </div>
                        {savedAssets.background && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-4 h-4" />
                                <span>Background saved successfully!</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
} 
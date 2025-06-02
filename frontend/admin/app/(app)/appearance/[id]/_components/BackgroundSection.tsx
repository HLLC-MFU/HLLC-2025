import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { CheckCircle, Upload, Image, Save, CloudUpload } from 'lucide-react';
import { Appearance } from '@/types/appearance';
import { useRef } from 'react';

interface BackgroundSectionProps {
    appearance: Appearance;
    previewUrls: Record<string, string>;
    assetDrafts: Record<string, File | null>;
    uploadingAssets: Record<string, boolean>;
    savedAssets: Record<string, boolean>;
    onFileChange: (key: string, file: File) => void;
    onSaveAsset: (key: string) => void;
    onCancel: () => void;
}

export function BackgroundSection({
    appearance,
    previewUrls,
    assetDrafts,
    uploadingAssets,
    savedAssets,
    onFileChange,
    onSaveAsset,
    onCancel,
}: BackgroundSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTriggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start p-2">
                        <h2 className="text-xl font-semibold">Background Image</h2>
                        <p className="text-sm">Main background for your school interface</p>
                    </div>
                </div>
            </CardHeader>
            <CardBody>
                <div className="flex flex-col gap-6 items-center">
                    <div className="flex-1 max-w-md">
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleTriggerUpload}
                        >
                            <img
                                key={previewUrls.background || appearance.assets.background}
                                src={
                                    previewUrls.background ||
                                    `http://localhost:8080/uploads/${appearance.assets.background}`
                                }
                                alt="background"
                                className="w-full rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center space-y-2">
                                <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Upload new background
                                </p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onFileChange('background', file);
                            }}
                            className="hidden"
                        />
                    </div>
                </div>
                <div className="flex space-y-4 justify-end">
                    <div className="flex justify-between gap-4">
                        <Button
                            color="primary"
                            size="lg"
                            variant='light'
                            className="w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            isLoading={uploadingAssets.background}
                            disabled={!assetDrafts.background}
                            onPress={() => {
                                if (assetDrafts.background) onSaveAsset('background');
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save
                            </span>
                        </Button>

                        <Button
                            color="danger"
                            size="lg"
                            variant='light'
                            className="w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!assetDrafts.background}
                            onPress={() => {
                                if (assetDrafts.background) {
                                    onCancel();
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

import { Card, CardBody, CardHeader } from '@heroui/react';
import { Eye } from 'lucide-react';
import { Appearance } from '@/types/appearance';

interface PreviewSectionProps {
    appearance: Appearance;
    colorDrafts: Record<string, string>;
}

export function PreviewSection({ appearance, colorDrafts }: PreviewSectionProps) {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Eye className="w-6 h-6" />
                    </div>
                    <div className='flex flex-col items-start'>
                        <h2 className="text-xl font-semibold">Live Preview</h2>
                        <p className="text-sm">See how your colors look in action</p>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Primary Color Usage</h3>
                        <div className="space-y-3">
                            <div
                                className="p-4 rounded-lg text-white font-medium"
                                style={{ backgroundColor: colorDrafts.primary }}
                            >
                                Primary Button Style
                            </div>
                            <div
                                className="p-3 rounded border-2 border-current text-current font-medium text-center"
                                style={{ color: colorDrafts.primary, borderColor: colorDrafts.primary }}
                            >
                                Primary Outline Style
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold">Secondary Color Usage</h3>
                        <div className="space-y-3">
                            <div
                                className="p-4 rounded-lg text-white font-medium"
                                style={{ backgroundColor: colorDrafts.secondary }}
                            >
                                Secondary Button Style
                            </div>
                            <div
                                className="p-3 rounded border-2 border-current text-current font-medium text-center"
                                style={{ color: colorDrafts.secondary, borderColor: colorDrafts.secondary }}
                            >
                                Secondary Outline Style
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold mb-3">Gradient Preview</h3>
                    <div
                        className="h-20 rounded-xl shadow-inner flex items-center justify-center text-white font-semibold text-lg"
                        style={{
                            background: `linear-gradient(135deg, ${colorDrafts.primary}, ${colorDrafts.secondary})`
                        }}
                    >
                        {appearance?.school?.name?.en ?? "School Name"}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
} 
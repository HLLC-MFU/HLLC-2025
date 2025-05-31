import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Palette } from 'lucide-react';

interface ColorsSectionProps {
    colorDrafts: Record<string, string>;
    onColorChange: (key: string, value: string) => void;
    onSaveColors: () => void;
}

export function ColorsSection({
    colorDrafts,
    onColorChange,
    onSaveColors
}: ColorsSectionProps) {
    return (
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Palette className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Color Scheme</h2>
                        <p className="text-purple-100 text-sm">Primary and secondary brand colors</p>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(["primary", "secondary"] as const).map((key) => (
                        <div key={key} className="space-y-4">
                            <h3 className="font-semibold text-gray-700 capitalize text-lg">{key} Color</h3>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative group">
                                    <div
                                        className="w-24 h-24 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 border-4 border-white"
                                        style={{ backgroundColor: colorDrafts[key] }}
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        {colorDrafts[key].toUpperCase()}
                                    </p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={colorDrafts[key]}
                                        onChange={(e) => onColorChange(key, e.target.value)}
                                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-center">
                        <Button
                            color="primary"
                            size="lg"
                            className="px-8 font-semibold"
                            startContent={<Palette className="w-5 h-5" />}
                            onPress={onSaveColors}
                        >
                            Save Color Scheme
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
} 
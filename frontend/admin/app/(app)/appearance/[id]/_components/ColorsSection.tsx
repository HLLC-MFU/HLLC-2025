import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Ban, Palette } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ColorsSectionProps {
  colors: Record<string, string>;
  onSave: () => void;
}

export function ColorsSection({ colors, onSave }: ColorsSectionProps) {
  const [previewColor, setPreviewColor] = useState<Record<string, string>>({});

  const handleColorChange = useCallback((key: string, value: string) => {
    setPreviewColor((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  useEffect(() => {
    setPreviewColor(colors);
  }, [colors]);

  return (
    <Card className="p-2">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Palette className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-semibold">Color Scheme</h2>
            <p className="text-sm">Primary and secondary brand colors</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(['primary', 'secondary'] as const).map((key) => (
            <div key={key} className="space-y-4">
              <h3 className="font-semibold capitalize text-lg">{key} Color</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Card
                    className={"w-24 h-24 rounded-2xl hover:shadow-xl hover:bg-white/10 transition-all duration-300 border-4 border-white"}
                    style={{ backgroundColor: previewColor[key] }}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-white/0 hover:bg-white/10 transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {previewColor[key]?.toUpperCase()}
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="color"
                    value={previewColor[key] ?? "#ffffff"}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <div className="flex justify-between gap-4">
            <Button
              isDisabled={JSON.stringify(colors) === JSON.stringify(previewColor)}
              color="danger"
              size="lg"
              variant="light"
              className="px-8 font-semibold"
              startContent={<Ban className="w-5 h-5" />}
              onPress={() => setPreviewColor(colors)}
            >
              Discard All
            </Button>
            <Button
              isDisabled={JSON.stringify(colors) === JSON.stringify(previewColor)}
              color="primary"
              size="lg"
              className="px-8 font-semibold"
              startContent={<Palette className="w-5 h-5" />}
              onPress={onSave}
            >
              Save Color Scheme
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

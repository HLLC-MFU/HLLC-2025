import ColorInput from '@/components/ui/colorInput';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader, Input } from '@heroui/react';
import { Ban, Palette } from 'lucide-react';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

interface ColorsSectionProps {
  colors: Record<string, string>;
  onSetColors: Dispatch<SetStateAction<Record<string, string>>>;
  onSave: () => void;
}

export function ColorsSection({
  colors,
  onSetColors,
  onSave
}: ColorsSectionProps) {
  const [previewColors, setPreviewColors] = useState<Record<string, string>>({});

  const handleColorChange = (key: string, value: string) => {
    setPreviewColors((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleColorSave = () => {
    onSetColors({
      primary: previewColors.primary,
      secondary: previewColors.secondary
    });
    onSave();
  };

  useEffect(() => {
    setPreviewColors(colors);
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
          <ColorInput
            colors={previewColors}
            handleColorChange={handleColorChange}
          />
        </div>

        <div className="flex justify-end mt-6">
          <div className="flex justify-between gap-4">
            <Button
              className="px-8 font-semibold"
              color="danger"
              isDisabled={JSON.stringify(colors) === JSON.stringify(previewColors)}
              size="lg"
              startContent={<Ban className="w-5 h-5" />}
              variant="light"
              onPress={() => setPreviewColors(colors)}
            >
              Discard All
            </Button>
            <Button
              className="px-8 font-semibold"
              color="primary"
              isDisabled={JSON.stringify(colors) === JSON.stringify(previewColors)}
              size="lg"
              startContent={<Palette className="w-5 h-5" />}
              onPress={handleColorSave}
            >
              Save Color Scheme
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

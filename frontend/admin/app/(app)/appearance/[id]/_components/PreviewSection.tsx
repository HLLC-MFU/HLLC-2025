import { Card, CardBody, CardHeader } from '@heroui/react';
import { Eye } from 'lucide-react';

import { Appearance } from '@/types/appearance';

interface PreviewSectionProps {
  appearance: Appearance;
  colors: Record<string, string>;
}

export function PreviewSection({ appearance, colors }: PreviewSectionProps) {
  const textColor =
    colors?.primary?.toLowerCase() === '#ffffff'
      ? 'text-default-600'
      : 'text-white';

  return (
    <Card className="p-2">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-semibold">Live Preview</h2>
            <p className="text-sm">See how your colors look in action</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['primary', 'secondary'] as const).map((key) => (
            <div className="space-y-4" key={key}>
              <h3 className="font-semibold capitalize">
                {key} Color Usage
              </h3>
              <div className="space-y-3">
                <Card
                  className={`p-4 rounded-lg font-medium ${textColor} capitalize`}
                  style={{ backgroundColor: colors[key] }}
                >
                  {key} Button Style
                </Card>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold mb-3">Gradient Preview</h3>
          <Card
            className={`h-20 rounded-xl flex items-center justify-center font-semibold text-lg ${textColor}`}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            {appearance?.school?.name?.en ?? 'School Name'}
          </Card>
        </div>
      </CardBody>
    </Card>
  );
}

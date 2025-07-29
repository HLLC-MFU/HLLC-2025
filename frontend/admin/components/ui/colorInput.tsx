import { Card, Input } from '@heroui/react';

type ColorInputProp = {
  fields?: string[];
  colors: Record<string, string>;
  handleColorChange: (key: string, value: string) => void;
};

export default function ColorInput({
  fields = ['primary', 'secondary'],
  colors,
  handleColorChange,
}: ColorInputProp) {
  return (
    <>
      {fields.map((key) => (
        <div key={key} className="flex flex-col gap-2 mb-6">
          <h3 className="capitalize font-medium">
            {key} Color
          </h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group w-full">
              <Card
                className={
                  'h-24 rounded-2xl hover:shadow-xl hover:bg-white/10 transition-all duration-300 border-4 border-white'
                }
                style={{ backgroundColor: colors[key] }}
              />
              <div className="absolute inset-0 rounded-2xl bg-white/0 hover:bg-white/10 transition-colors duration-300" />
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="w-full text-sm text-gray-600 text-center bg-gray-100 border border-default-200 px-3 py-1 rounded-md">
                {colors[key]?.toUpperCase() ?? 'Select a color'}
              </p>
              <Input
                type="color"
                value={colors[key] ?? '#ffffff'}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-40 rounded-xl cursor-pointer border border-default-200 hover:border-default-300 transition-colors"
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

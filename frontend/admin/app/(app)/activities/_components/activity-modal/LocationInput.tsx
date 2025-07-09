import { Input } from '@heroui/react';
import { MapPin } from 'lucide-react';
interface LocationProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function LocationInput({
  label,
  value,
  onChange,
}: LocationProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Input label={label} value={value} onChange={(e) => onChange(e.target.value)}/>
    </div>
  );
}

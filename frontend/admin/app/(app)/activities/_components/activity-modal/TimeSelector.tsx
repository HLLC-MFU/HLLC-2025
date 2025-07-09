import { DatePicker } from '@heroui/react';
import { Clock } from 'lucide-react';
import { DateValue, getLocalTimeZone, now } from '@internationalized/date';

interface DateTimeSelectorProps {
  label: string;
  value: DateValue;
  onChange: (value: DateValue) => void;
}

export function DateTimeSelector({
  label,
  value,
  onChange,
}: DateTimeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <DatePicker
        hideTimeZone
        showMonthAndYearPickers
        defaultValue={now(getLocalTimeZone())}
        label={label}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

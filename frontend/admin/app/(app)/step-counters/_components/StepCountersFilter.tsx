'use client';

import { Input } from '@heroui/react';
import { Search } from 'lucide-react';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function StepCountersFilter({ value, onChange }: Props) {
  return (
    <Input
      isClearable
      value={value}
      onValueChange={onChange}
      placeholder="Search by name, school, or major..."
      startContent={<Search className="text-default-400 w-4 h-4" />}
      className="max-w-md mb-4"
    />
  );
}

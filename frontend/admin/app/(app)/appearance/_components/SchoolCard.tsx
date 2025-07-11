'use client';

import type { School } from '@/types/school';

import { Button, Card, CardFooter, CardHeader, Divider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

import { Appearance } from '@/types/appearance';

interface SchoolCardProps {
  school: School;
  fetchAppearancesById: (id: string) => Promise<{ data: Appearance[] } | null>;
  createAppearance: (appearanceFormData: FormData) => Promise<void>;
}

export function SchoolCard({
  school,
  fetchAppearancesById,
  createAppearance,
}: SchoolCardProps) {
  const router = useRouter();

  const handleClick = async () => {
    if (school?._id) {
      const data = await fetchAppearancesById(school._id);

      if (!data) {
        const formData = new FormData();

        formData.append('school', school._id);
        await createAppearance(formData);
      }
      router.push(`/appearance/${school._id}`);
    }
  };

  return (
    <div className="hover:cursor-pointer" onClick={handleClick}>
      <Card isHoverable className="h-full">
        <CardHeader className="flex gap-3 p-4">
          <Card
            className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
            radius="md"
          >
            {school.acronym}
          </Card>
          <div className="flex flex-col items-start min-w-0 text-start">
            <p className="text-lg font-semibold truncate w-full">
              {school.name.en}
            </p>
            <p className="text-small text-default-500 truncate w-full">
              {school.name.th}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardFooter className="flex justify-between p-4">
          <Button
            className="flex-1 sm:flex-none"
            color="primary"
            size="sm"
            startContent={<Eye size={16} />}
            variant="light"
            onPress={handleClick}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

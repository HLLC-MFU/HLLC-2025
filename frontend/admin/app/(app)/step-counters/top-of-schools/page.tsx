'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { GraduationCap, Footprints, User, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';

const mockData = Array.from({ length: 20 }, () => ({
  id: '6631503038',
  name: 'Wasan Nachai',
  school: 'ADT',
  schoolFull: 'Applied Digital Technology',
  major: 'SE',
  steps: 15000,
}));

export default function TopOfSchoolsPage() {
  const router = useRouter();

  return (
    <div className="p-4">
      <PageHeader
        title="StepConters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <Button
        startContent={<ArrowLeft />}
        variant="flat"
        onPress={() => router.back()}
      >
        Back
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {mockData.map((user, idx) => (
          <Card key={idx} className="rounded-xl border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex items-center gap-4 border-b pb-2">
              <div className="text-center font-bold text-lg">{user.school}</div>
              <div className="text-xs text-gray-500 ml-auto">{user.schoolFull}</div>
            </CardHeader>
            <CardBody className="space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <User size={16} />
                <span>{user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{user.id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap size={16} />
                <span>{user.major}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Footprints size={16} />
                <span>{user.steps.toLocaleString()}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

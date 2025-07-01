'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Footprints, Globe, Target, School, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardBody } from '@heroui/react';

export default function StepContersPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<'Top Overall' | 'Top of Schools' | 'First Achiever' | null>('Top Overall');
  const stepTarget = 3000;

  const sections = [
    {
      key: 'Top Overall',
      title: 'Top Overall',
      subtitle: 'For the student with the highest step count',
      icon: <Globe />,
      href: "/step-counters/top-overall",
    },
    {
      key: 'Top of Schools',
      title: 'Top of Schools',
      subtitle: 'For the student with the highest step count in each school',
      icon: <School />,
      href: "/step-counters/top-of-schools",
      
    },
    {
      key: 'First Achiever',
      title: 'First Achiever',
      subtitle: `For the first student to reach ${stepTarget} steps`,
      icon: <Target />,
      href: "/step-counters/first-achiever",
    }
  ] as const;

  return (
    <div>
      <PageHeader
        title="step-counters"
        description="View The Steps And LeaderBoard"
        icon={<Footprints />}
      />

      <div className="space-y-3 mt-6">
        {sections.map((section) => (
          <Card
            key={section.key}
            isHoverable
            isPressable
            shadow="none"
            onPress={() => {
              setSelected(section.key);
              if (section.href) router.push(section.href);
            }}
            className={`w-full border transition ${
              selected === section.key ?  '': ''
            }`}
          >
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl text-gray-600">
                    {section.icon}
                  </div>
                  <div>
                    <div className="text-md font-semibold">{section.title}</div>
                    <div className="text-sm text-gray-500">{section.subtitle}</div>
                  </div>
                </div>
                <ChevronRight />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

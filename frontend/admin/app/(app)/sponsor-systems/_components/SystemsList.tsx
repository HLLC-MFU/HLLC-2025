'use client';

import { Card, CardBody } from '@heroui/react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';

interface Props {
  item: {
    title: string;
    description: string;
    icon: JSX.Element;
    href: string;
  };
}

export default function SystemsList({ item }: Props) {
  const router = useRouter();

  return (
    <>
      <Card
        isHoverable
        isPressable
        shadow="none"
        className="border"
        onPress={() => router.push(item.href)}
      >
        <CardBody className="justify-between">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                {item.icon && (
                  <span className="text-gray-500">{item.icon}</span>
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-default-800 tracking-tight">
                  {item.title}
                </h1>
                <p className="text-start text-xs text-default-500">
                  {item.description}
                </p>
              </div>
            </div>
            <div>
              <ChevronRight />
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

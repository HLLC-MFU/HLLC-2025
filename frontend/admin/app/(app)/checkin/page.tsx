'use client';

import { TableLog } from './_components/TableLog';
import { QrCodeScanner } from './_components/QrCodeScanner';
import { useState } from 'react';
import Selectdropdown from './_components/Select';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@heroui/button';
import { UserRound, Plus } from 'lucide-react';

export default function checkin() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [forceVisible] = useState(false);
  return (
    <>
      <PageHeader description='This is Management Page' icon={<UserRound />} right={
        <Button color="primary" size="lg" endContent={<Plus size={20} />} onPress={() => {}}>New Role</Button>
      } />
      <div className="flex flex-col">
        <div className="container flex justify-center items-center">
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <Selectdropdown
              selectedActivityIds={selectedActivityIds}
              setSelectActivityIds={setSelectedActivityIds}
              forceVisible={forceVisible}
            />
          </div>
        </div>
        <QrCodeScanner selectedActivityIds={selectedActivityIds} />
        <TableLog />
      </div>
    </>
  );
}
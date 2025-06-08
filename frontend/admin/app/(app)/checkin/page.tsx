'use client';

import { TableLog } from './_components/TableLog';
import { QrCodeScanner } from './_components/QrCodeScanner';
import { useState } from 'react';
import Selectdropdown from './_components/Select';
import { PageHeader } from '@/components/ui/page-header';
import { UserRound, Plus } from 'lucide-react';

export default function checkin() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [forceVisible] = useState(false);
  return (
    <>
      <PageHeader description='This is Management Page' icon={<UserRound />} />

      <div className="flex justify-center items-center">
          <Selectdropdown
            selectedActivityIds={selectedActivityIds}
            setSelectActivityIds={setSelectedActivityIds}
            forceVisible={forceVisible}
          />
        </div>
      <QrCodeScanner selectedActivityIds={selectedActivityIds} />
      <TableLog />

    </>
  );
}
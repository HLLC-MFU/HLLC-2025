'use client';
import { useState } from 'react';
import { UserRound } from 'lucide-react';

import { QrCodeScanner } from './_components/QrCodeScanner';
import Selectdropdown from './_components/Select';

import { PageHeader } from '@/components/ui/page-header';


export default function CheckinPage() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [forceVisible] = useState(false);

  return (
    <>
      <PageHeader description='This is Management Page' icon={<UserRound />} />
      <div className='gap-4'>
        <div className="flex justify-center items-center">
          <Selectdropdown
            forceVisible={forceVisible}
            selectedActivityIds={selectedActivityIds}
            setSelectActivityIds={setSelectedActivityIds}
          />
        </div>
        <QrCodeScanner selectedActivityIds={selectedActivityIds} />
        {/* <TableLog /> */}
      </div>

    </>
  );
}
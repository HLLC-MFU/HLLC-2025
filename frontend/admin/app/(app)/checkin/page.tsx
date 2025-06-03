'use client';

import { TableLog } from './_components/TableLog';
import { QrCodeScanner } from './_components/QrCodeScanner';
import { useState } from 'react';
import Selectdropdown from './_components/Select';

export default function checkin() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [forceVisible] = useState(false);
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto flex justify-center items-center px-4 py-5">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-center sm:text-left ">
            Checkin
          </h1>
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
  );
}

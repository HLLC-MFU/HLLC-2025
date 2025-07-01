'use client';
import { useState } from 'react';
import Selectdropdown from './_components/SelectActivityType';
import { PageHeader } from '@/components/ui/page-header';
import { UserRound } from 'lucide-react';
import { Tab, Tabs } from '@heroui/react';
import { CheckinQrcode } from './_components/CheckinQrcode';
import { CheckinTyping } from './_components/CheckinTyping';
import { CheckinTable } from './_components/CheckinTable';

export default function CheckinPage() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  return (
    <>
      <PageHeader description="This is Management Page" icon={<UserRound />} />

      <Tabs className="flex items-center justify-center sm:hidden" color="primary">
        <Tab key="Qrcode" className="flex items-center" title="QrcodeScanner">
          <div className="flex flex-col justify-center items-center space-y-5 w-full my-3 sm:hidden">
            <Selectdropdown
              selectedActivityIds={selectedActivityIds}
              setSelectActivityIds={setSelectedActivityIds}
            />
            <CheckinQrcode selectedActivityIds={selectedActivityIds} />
          </div>
        </Tab>

        <Tab key="Typing" title="Typing" className="flex items-center ">
          <div className="flex w-full my-3 flex-col space-y-5 sm:hidden">
            <Selectdropdown
              selectedActivityIds={selectedActivityIds}
              setSelectActivityIds={setSelectedActivityIds}
            />
            <CheckinTyping
              selectedActivityIds={selectedActivityIds}
            />
          </div>
        </Tab>
      </Tabs>

      <CheckinTable/>
    </>
  );
}

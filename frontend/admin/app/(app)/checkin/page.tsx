'use client';
import { useState } from 'react';
import { Select, SelectItem, Tab, Tabs } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { CheckinQrcode } from './_components/CheckinQrcode';
import { CheckinTyping } from './_components/CheckinTyping';
import { useActivities } from '@/hooks/useActivities';
import { UserRound } from 'lucide-react';
// import { CheckinTable } from './_components/CheckinTable';

export default function CheckinPage() {
  const [ selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const { activities } = useActivities();

  function SelectDropDown (){
      return (
          <Select
            className="flex w-full flex-wrap md:flex-nowrap text-sm sm:overflow-hidden text-center"
            label="Select Activities"
            placeholder="Select Activities"
            selectionMode="multiple"
            selectedKeys={new Set(selectedActivityIds)}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys) as string[];
              setSelectedActivityIds(selected);
            }}
          >
            {(activities ?? []).map((activity) => (
              <SelectItem key={activity._id} textValue={activity.name.en}>
                <div className="flex flex-col">
                  <span>{activity?.name?.en}</span>
                  <span className="text-sm text-default-500">
                    ( {activity?.name?.th} )
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
      );
  }

  return (
    <>
      <PageHeader description="This is Management Page" icon={<UserRound />} />

      <Tabs className="flex items-center justify-center sm:hidden" color="primary" radius="full" size='lg'>
        <Tab key="Qrcode" className="flex items-center" title="QrcodeScanner">
          <div className="flex flex-col justify-center items-center space-y-5 w-full my-3 sm:hidden">
            <SelectDropDown/>
            <CheckinQrcode selectedActivityIds={selectedActivityIds}/>
          </div>
        </Tab>

        <Tab key="Typing" title="Typing" className="flex items-center">
          <div className="flex w-full my-3 flex-col space-y-5 sm:hidden">
            <SelectDropDown/>
            <CheckinTyping selectedActivityIds={selectedActivityIds}/>
          </div>
        </Tab>
      </Tabs>

      {/* <CheckinTable/> */}
    </>
  );
}

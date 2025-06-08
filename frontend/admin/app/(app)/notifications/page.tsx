'use client';
import { BellIcon, SendHorizontal } from 'lucide-react';
import { Button, Select, SelectItem } from '@heroui/react';
import { SelectStudent } from './_components/Selectstudentinfo';
import { Informationinfo } from './_components/InfoFrom';
import { PreviewApp, PreviewOutApp } from './_components/Preview';
import { InformationInfoData } from './_components/InfoFrom';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';

export const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];

export default function NotiManage() {
  const [selectLanguagePreview, setSelectLanguagePreview] = useState< 'en' | 'th' >('en');
  const [selectLanguageNotification, setSelectLanguageNotification] = useState< 'en' | 'th' >('en');
  const [infoData, setInfoData] = useState<InformationInfoData | undefined>(undefined);

  console.log('ข้อมูลหน้าบ้าน', infoData);
  return (
    <>
			<PageHeader description='Create, manage, and view system notifications for specific users or roles.' icon={<BellIcon />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div id="Notification Info" className="flex row-span-2 w-full">
            <div className="flex flex-col w-full gap-6">
              <div className="flex flex-col w-full px-5 py-6 gap-6 bg-white rounded-2xl border border-gray-300 shadow-md">
                <h1 className="text-xl font-bold ">Preview</h1>
                <SelectStudent />
              </div>
              <div className="flex flex-col w-full px-5 py-6 gap-6 bg-white rounded-2xl border border-gray-300 shadow-md">
                <Informationinfo onChange={setInfoData} />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            id="Preview (Application)"
            className="flex flex-col bg-white rounded-2xl border border-gray-300 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview In Application</h1>
              <Select
                className="w-56"
                value={selectLanguagePreview}
                items={language}
                label="Language"
                placeholder="Select an Language"
                selectedKeys={[selectLanguagePreview]}
                onSelectionChange={key => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setSelectLanguagePreview(lang);
                }}
              >
                {lang => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>
            <PreviewApp info={infoData} lang={selectLanguagePreview} />
            <Button
              color="primary"
              endContent={<SendHorizontal />}
              className="p-4"
              size="md"
            >
              <p className=" text-xl font-medium">Post</p>
            </Button>
          </div>
          <div
            id="Preview (Application)"
            className="flex flex-col bg-white rounded-2xl border border-gray-300 h-96 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview Notfication</h1>
              <Select
                className="w-56"
                value={selectLanguageNotification}
                items={language}
                label="Language"
                placeholder="Select an Language"
                selectedKeys={[selectLanguageNotification]}
                onSelectionChange={key => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setSelectLanguageNotification(lang);
                }}
              >
                {lang => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>
            <PreviewOutApp info={infoData} lang={selectLanguageNotification} />
          </div>
        </div>
      </div>
    </>
  );
}
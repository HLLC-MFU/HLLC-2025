'use client';
import { BellIcon, SendHorizontal } from 'lucide-react';
import { Button, Select, SelectItem } from '@heroui/react';
import { SelectStudent } from './_components/Selectstudentinfo';
import { Informationinfo } from './_components/InfoFrom';
import { PreviewApp, PreviewOutApp } from './_components/Preview';
import { InformationInfoData } from './_components/InfoFrom';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { BellRing } from "lucide-react"
import { useNotification } from '@/hooks/useNotification';
import type { Notification } from '@/types/student';

export const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];



export default function NotiManage() {
  const [selectLanguagePreview, setSelectLanguagePreview] = useState<'en' | 'th'>('en');
  const [selectLanguageNotification, setSelectLanguageNotification] = useState<'en' | 'th'>('en');
  const [infoData, setInfoData] = useState<InformationInfoData | undefined>(undefined);
  const [scope, setScope] = useState<'global' | { type: 'individual'; id: string[] }[]>('global');
  const { createNotification } = useNotification()

  const handleSubmit = () => {

    if (infoData) {
      const payload: Notification = {
        title: infoData.title,
        subtitle: infoData.subtitle,
        body: infoData.body,
        icon:
          typeof infoData.icon === 'function'
            ? infoData.icon.displayName || infoData.icon.name || 'default'
            : 'default',

        image: infoData.imageUrl ?? '',
        scope,
      };
      // เฉพาะเมื่อมี redirect.link จริง
      if (infoData.redirect.link.trim() !== '') {
        payload.redirectButton = {
          label: {
            en: infoData.redirect.en,
            th: infoData.redirect.th
          },
          url: infoData.redirect.link
        };
      }

      createNotification(payload);
    }
  }

  console.log('ข้อมูลหน้าบ้าน', infoData);
  return (
    <>
			<PageHeader description='Create, manage, and view system notifications for specific users or roles.' icon={<BellIcon />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div id="Notification Info" className="flex row-span-2 w-full">
            <div className="flex flex-col w-full gap-6">
              <div className="flex flex-col w-full px-5 py-6 gap-6  rounded-2xl border border-gray-300 shadow-md">
                <h1 className="text-2xl font-bold ">Preview</h1>
                <SelectStudent onScopeChange={setScope} />
              </div>
              <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
                <Informationinfo onChange={setInfoData} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col px-4 gap-6 w-full">
          <div
            id="Preview (Application)"
            className="flex flex-col  rounded-2xl border border-gray-300 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview In Application</h1>
              <Select
                className="max-w-[9rem]"
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
              className="p-5"
              size="md"
              onPress={handleSubmit}
            >
              <p className=" text-lg font-medium">Post</p>
            </Button>
          </div>
          <div
            id="Preview (Application)"
            className="flex flex-col rounded-2xl border border-gray-300 h-96 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview Notfication</h1>
              <Select
                className="max-w-[9rem]"
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
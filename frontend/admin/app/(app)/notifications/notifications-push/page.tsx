'use client';
import { SendHorizontal, BellRing } from 'lucide-react';
import { Button, Select, SelectItem, addToast } from '@heroui/react';
import { SelectStudent } from './_components/NotificationScope';
import { Informationinfo } from './_components/NotificationForm';
import { PreviewApp, PreviewOutApp } from './_components/NotificationPreview';
import { InformationInfoData } from './_components/NotificationForm';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';

const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];

type SelectionScope =
  | 'global'
  | { type: 'individual' | 'school' | 'major'; id: string[] }[];

function isValidUrl(url?: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function isFormComplete(data?: InformationInfoData): boolean {
  if (!data) return false;

  const { title, subtitle, body } = data;

  return Boolean(
    title?.th?.trim() &&
    title?.en?.trim() &&
    subtitle?.th?.trim() &&
    subtitle?.en?.trim() &&
    body?.th?.trim() &&
    body?.en?.trim()
  );
}



export default function NotificationPust() {
  const [selectLanguagePreview, setSelectLanguagePreview] = useState<'en' | 'th'>('en');
  const [selectLanguageNotification, setSelectLanguageNotification] = useState<'en' | 'th'>('en');
  const [infoData, setInfoData] = useState<InformationInfoData | undefined>(undefined);
  const [scope, setScope] = useState<SelectionScope>('global');
  const [resetFormCounter, setResetFormCounter] = useState(0);
  const { createNotification } = useNotification();

  const submitNotification = () => {
    if (!infoData) return;

    const formData = new FormData();
    formData.append("title[th]", infoData.title.th)
    formData.append("title[en]", infoData.title.en)
    formData.append("subtitle[th]", infoData.subtitle.th)
    formData.append("subtitle[en]", infoData.subtitle.en)
    formData.append("body[th]", infoData.body.th)
    formData.append("body[en]", infoData.body.en)
    formData.append("scope", typeof scope === 'string' ? scope : JSON.stringify(scope))
    formData.append("icon", (infoData.icon && typeof infoData.icon === 'object'
      ? (infoData.icon as any)?.render?.displayName
      : undefined) || 'UnknownIcon'
    );
    if (infoData.imageFile) {
      formData.append("image", infoData.imageFile);
    }
    if (infoData.redirect?.link?.trim() !== '') {
      formData.append("redirectButton[label][en]", infoData.redirect.en)
      formData.append("redirectButton[label][th]", infoData.redirect.th)
      formData.append("redirectButton[url]", infoData.redirect.link)
    }
    createNotification(formData);

    addToast({
      title: `Post Notification ${infoData.title.en} Complete`,
      color: "success"
    })

    setInfoData(undefined);
    setResetFormCounter(prev => prev + 1);
  }

  // กัน user error

  const isSubmitDisabled =
  !infoData ||
  !isFormComplete(infoData) ||
  !isValidUrl(infoData.redirect?.link) ||
  (infoData.imageFile && infoData.imageFile.size > 500 * 1024);


  return (
    <>
      <PageHeader title="Notifications Push" description='Create, manage, and view system notifications for specific users or roles.' icon={<BellRing />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div id="Notification Info" className="flex row-span-2 w-full">
            <div className="flex flex-col w-full gap-6">
              <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
                <h1 className="text-2xl font-bold ">Preview</h1>
                <SelectStudent onScopeChange={setScope} />
              </div>
              <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
                <Informationinfo onChange={setInfoData} resetSignal={resetFormCounter} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col px-4 gap-6 w-full">
          <div id="Preview (Application)" className="flex flex-col rounded-2xl border border-gray-300 p-6 gap-6 shadow-md items-end">
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview In Application</h1>
              <Select
                className="max-w-[9rem]"
                value={selectLanguagePreview}
                items={language}
                label="Language"
                placeholder="Select a Language"
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

            {infoData && <PreviewApp info={infoData} lang={selectLanguagePreview} />}

            <div className='flex items-center gap-5'>

              {!isValidUrl(infoData?.redirect?.link) && (
                <p className="text-red-500 font-medium">⚠ Invalid redirect link</p>
              )}

              {!isFormComplete(infoData) && ( <p className="text-red-500 font-medium">⚠ Data is not complete</p> )}

              {(infoData && infoData.imageFile && infoData.imageFile.size > 500 * 1024) && 
              ( <p className="text-red-500 font-medium">⚠ Please upload an image smaller than 500KB</p> )}

              <Button
                color="primary"
                endContent={<SendHorizontal />}
                className="p-5"
                size="md"
                isDisabled={isSubmitDisabled}
                onPress={submitNotification}
              >
                <p className=" text-lg font-medium">Post</p>
              </Button>
            </div>
          </div>

          <div id="Preview (Application)" className="flex flex-col rounded-2xl border border-gray-300 h-96 p-6 gap-6 shadow-md items-end">
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview Notification</h1>
              <Select
                className="max-w-[9rem]"
                value={selectLanguageNotification}
                items={language}
                label="Language"
                placeholder="Select a Language"
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

            {infoData && (
              <PreviewOutApp info={infoData} lang={selectLanguageNotification} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

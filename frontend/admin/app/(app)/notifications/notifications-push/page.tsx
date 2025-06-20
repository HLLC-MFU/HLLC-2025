'use client';
import { SendHorizontal, BellPlus } from 'lucide-react';
import { Button, Select, SelectItem, addToast } from '@heroui/react';
import { PushNotificationApplication, PushNotification } from './_components/NotificationPushNotification';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';
import { NotificationFormSection } from './_components/NotificationFormSection';

const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];

type InformationInfoData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  body: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
  imageUrl?: string;
  imageFile?: File;
};

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
      body?.en?.trim(),
  );
}

export default function NotificationPush() {
  const [LanguagePreview, setLanguagePreview] = useState<'en' | 'th' >('en');
  const [LanguageNotification, setLanguageNotification] = useState< 'en' | 'th' >('en');
  const [infoData, setInfoData] = useState<InformationInfoData | undefined>( undefined );
  const [scope, setScope] = useState<SelectionScope>('global');
  const [resetFormCounter, setResetFormCounter] = useState(0);
  const { createNotification } = useNotification();

  const submitNotification = () => {
    if (!infoData) return;

    const formData = new FormData();
    formData.append('title', JSON.stringify(infoData.title));
    formData.append('subtitle', JSON.stringify(infoData.subtitle));
    formData.append('body', JSON.stringify(infoData.body));
    formData.append('scope', JSON.stringify(scope));
    formData.append(
      'icon',
      (infoData.icon && typeof infoData.icon === 'object'
        ? (infoData.icon as any)?.render?.displayName
        : undefined) || 'UnknownIcon',
    );
    if (infoData.imageFile) {
      formData.append('image', infoData.imageFile);
    }
    if (infoData.redirect?.link?.trim()) {
      formData.append(
        'redirectButton',
        JSON.stringify({
          label: {
            th: infoData.redirect.th,
            en: infoData.redirect.en,
          },
          url: infoData.redirect.link,
        }),
      );
    }
    createNotification(formData);

    addToast({
      title: `Post Notification ${infoData.title.en} Complete`,
      color: 'success',
    });

    setInfoData(undefined);
    setResetFormCounter((prev) => prev + 1);
  };

  // กัน user error

  const isSubmitDisabled =
    !infoData ||
    !isFormComplete(infoData) ||
    !isValidUrl(infoData.redirect?.link) ||
    (infoData.imageFile && infoData.imageFile.size > 500 * 1024);

  return (
    <>
      <PageHeader
        title="Notifications Push"
        description="Create, manage, and view system notifications for specific users or roles."
        icon={<BellPlus />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div id="Notification Info" className="flex row-span-2 w-full">
            <NotificationFormSection
              setScope={setScope}
              setInfoData={setInfoData}
              resetFormCounter={resetFormCounter}
            />
        </div>

        <div className="flex flex-col px-4 gap-6 w-full">
          <div
            id="Preview (Application)"
            className="flex flex-col rounded-2xl border border-gray-300 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview In Application</h1>
              <Select
                className="max-w-[9rem]"
                value={LanguagePreview}
                items={language}
                label="Language"
                placeholder="Select a Language"
                selectedKeys={[LanguagePreview]}
                onSelectionChange={(key) => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setLanguagePreview(lang);
                }}
              >
                {(lang) => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>

            {infoData && (
              <PushNotificationApplication Information={infoData} Language={LanguagePreview} />
            )}

            <div className="flex items-center gap-5">
              {!isValidUrl(infoData?.redirect?.link) && (
                <p className="text-red-500 font-medium">
                  ⚠ Invalid redirect link
                </p>
              )}

              {!isFormComplete(infoData) && (
                <p className="text-red-500 font-medium">
                  ⚠ Data is not complete
                </p>
              )}

              {infoData &&
                infoData.imageFile &&
                infoData.imageFile.size > 500 * 1024 && (
                  <p className="text-red-500 font-medium">
                    ⚠ Please upload an image smaller than 500KB
                  </p>
                )}

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

          <div
            id="Preview (Application)"
            className="flex flex-col rounded-2xl border border-gray-300 h-96 p-6 gap-6 shadow-md items-end"
          >
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Preview Notification</h1>
              <Select
                className="max-w-[9rem]"
                value={LanguageNotification}
                items={language}
                label="Language"
                placeholder="Select a Language"
                selectedKeys={[LanguageNotification]}
                onSelectionChange={(key) => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setLanguageNotification(lang);
                }}
              >
                {(lang) => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>

            {infoData && (
              <PushNotification
                Information={infoData}
                Language={LanguageNotification}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

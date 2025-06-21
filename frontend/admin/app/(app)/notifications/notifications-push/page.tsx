'use client';
import { SendHorizontal, BellPlus } from 'lucide-react';
import { Button, Select, SelectItem, addToast } from '@heroui/react';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';
import { NotificationFormSection } from './_components/NotificationFormSection';
import { PushNotificationApp } from './_components/PushNotification/PushNotificationApp';
import { PushNotification } from './_components/PushNotification/PushNotification';

const language = [
  { key: 'en', label: 'EN' },
  { key: 'th', label: 'TH' },
];

type InformationData = {
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

function isFormComplete(data?: InformationData): boolean {
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
  const [languagePreview, setLanguagePreview] = useState<'en' | 'th' >('en');
  const [languageNotification, setLanguageNotification] = useState< 'en' | 'th' >('en');
  const [informationData, setInformationData] = useState<InformationData | undefined>( undefined );
  const [scope, setScope] = useState<SelectionScope>('global');
  const [resetFormCounter, setResetFormCounter] = useState(0);
  const { createNotification } = useNotification();

  const submitNotification = () => {
    if (!informationData) return;

    const formData = new FormData();
    formData.append('title', JSON.stringify(informationData.title));
    formData.append('subtitle', JSON.stringify(informationData.subtitle));
    formData.append('body', JSON.stringify(informationData.body));
    formData.append('scope', JSON.stringify(scope));
    formData.append(
      'icon',
      (informationData.icon && typeof informationData.icon === 'object'
        ? (informationData.icon as any)?.render?.displayName
        : undefined) || 'UnknownIcon',
    );
    if (informationData.imageFile) {
      formData.append('image', informationData.imageFile);
    }
    if (informationData.redirect?.link?.trim()) {
      formData.append(
        'redirectButton',
        JSON.stringify({
          label: {
            th: informationData.redirect.th,
            en: informationData.redirect.en,
          },
          url: informationData.redirect.link,
        }),
      );
    }
    createNotification(formData);

    addToast({
      title: `Post Notification ${informationData.title.en} Complete`,
      color: 'success',
    });

    setInformationData(undefined);
    setResetFormCounter((prev) => prev + 1);
  };

  // กัน user error

  const isSubmitDisabled =
    !informationData ||
    !isFormComplete(informationData) ||
    !isValidUrl(informationData.redirect?.link) ||
    (informationData.imageFile && informationData.imageFile.size > 500 * 1024);

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
              setInformationData={setInformationData}
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
                value={languagePreview}
                items={language}
                label="Language"
                placeholder="Select a Language"
                selectedKeys={[languagePreview]}
                onSelectionChange={(key) => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setLanguagePreview(lang);
                }}
              >
                {(lang) => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>

            {informationData && (
              <PushNotificationApp Information={informationData} Language={languagePreview} />
            )}

            <div className="flex items-center gap-5">
              {!isValidUrl(informationData?.redirect?.link) && (
                <p className="text-red-500 font-medium">
                  ⚠ Invalid redirect link
                </p>
              )}

              {!isFormComplete(informationData) && (
                <p className="text-red-500 font-medium">
                  ⚠ Data is not complete
                </p>
              )}

              {informationData &&
                informationData.imageFile &&
                informationData.imageFile.size > 500 * 1024 && (
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
                value={languageNotification}
                items={language}
                label="Language"
                placeholder="Select a Language"
                selectedKeys={[languageNotification]}
                onSelectionChange={(key) => {
                  const lang = Array.from(key)[0];
                  if (lang === 'en' || lang === 'th')
                    setLanguageNotification(lang);
                }}
              >
                {(lang) => <SelectItem key={lang.key}>{lang.label}</SelectItem>}
              </Select>
            </div>

            {informationData && (
              <PushNotification
                Information={informationData}
                Language={languageNotification}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

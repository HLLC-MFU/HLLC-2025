'use client';
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/types/notification';
import { addToast, Button, Card, CardBody } from '@heroui/react';
import { BellPlus, SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import { NotificationForm } from './_components/NotificationForm';
import { InAppNotificationPreview } from './_components/InAppNotificationPreview';
import { PushNotificationPreview } from './_components/PushNotificationPreview';
import { Lang } from '@/types/lang';
import LanguageTabs from './_components/LanguageTabs';
import { NotificationScopeSelector } from './_components/NotificationScopeSelector';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchool';
import { useMajors } from '@/hooks/useMajor';
import { ConfirmationModal } from '@/components/modal/ConfirmationModal';

export type NotificationFormData = Notification & {
  imageURL?: string;
};

export default function NotificationPush() {
  const { createNotification } = useNotification();
  const { schools } = useSchools();
  const { majors } = useMajors()
  const { users } = useUsers();
  const [isConfirmModal, setIsConfirmModal] = useState<boolean>(false)

  const [notificationFormData, setNotificationFormData] = useState<NotificationFormData>({
    title: { en: '', th: '' },
    subtitle: { en: '', th: '' },
    body: { en: '', th: '' },
    icon: '',
    scope: 'global',
  });

  const previewLanguageOptions: { key: keyof Lang; label: string; icon: string }[] = [
    { key: 'en', label: 'EN' , icon: '/icons/gb.svg' },
    { key: 'th', label: 'TH' , icon: '/icons/th.svg' },
  ];

  const [previewLanguage, setPreviewLanguage] = useState<keyof Lang>('en');

  const submitNotification = () => {
    setIsConfirmModal(false)
    const formData = new FormData();

    formData.append('title', JSON.stringify(notificationFormData.title));
    formData.append('subtitle', JSON.stringify(notificationFormData.subtitle));
    formData.append('body', JSON.stringify(notificationFormData.body));
    formData.append('icon', notificationFormData.icon );

    if (notificationFormData.scope.length === 0) {
      addToast({
        title: 'Please select at least one target',
        description: 'Target group is empty',
        color: 'danger',
      });
      return;
    }
    formData.append('scope', JSON.stringify(notificationFormData.scope));

    if (notificationFormData.image) {
      formData.append('image', notificationFormData.image);
    }

    if (notificationFormData.redirectButton?.url?.trim()) {
      formData.append(
        'redirectButton',
        JSON.stringify({
          label: notificationFormData.redirectButton.label,
          url: notificationFormData.redirectButton.url,
        }),
      );
    }

    createNotification(formData);
  };

  return (
    <>
      <PageHeader
        title="Notifications Push"
        description="Create notifications"
        icon={<BellPlus />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-">
        <div className="flex row-span-2 w-full">
            <div className="flex flex-col w-full gap-3">
              <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
                <h1 className="text-xl font-bold">Target Group</h1>
                <NotificationScopeSelector
                  notification={notificationFormData} 
                  onChange={setNotificationFormData}
                  schools={schools}
                  majors={majors}
                  users={users}
                />
                
              </div>
              <div className="px-5 py-6 rounded-2xl border border-gray-300 shadow-md">
                <NotificationForm 
                  notification={notificationFormData} 
                  onChange={setNotificationFormData}
                  onSubmit={() => setIsConfirmModal(true)}
                />
              </div>
            </div>
        </div>

        <div className="flex flex-col px-4 gap-3 w-full sticky top-0">

          <div className="flex flex-col rounded-2xl border border-gray-300 p-6 gap-3 shadow-md">
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">In-App Notification Preview</h1>
              <LanguageTabs
                languageOptions={previewLanguageOptions}
                previewLanguage={previewLanguage}
                setPreviewLanguage={setPreviewLanguage}
              />
            </div>

            <InAppNotificationPreview 
              notification={notificationFormData}
              language={previewLanguage}  
            />
          </div>

          <div className="flex flex-col rounded-2xl border border-gray-300 h-fit p-6 gap-3 shadow-md">
            <div className="flex flex-row justify-between w-full">
              <h1 className="text-xl font-bold ">Push Notification Preview</h1>
            </div>

            <PushNotificationPreview
              notification={notificationFormData}
              language={previewLanguage}
            />
          </div>

          <Card className='border border-gray-300'>
            <CardBody>
              <Button 
                type="submit"
                form='notification-form'
                color='primary'
                endContent={<SendHorizontal />}
              >
                <p className="text-medium">Send Notification</p>
              </Button>
            </CardBody>
          </Card>

        </div>

      </div>
			<ConfirmationModal
        title='Send Notification'
        body='Are you sure to send notification'
        cancelColor='danger'
        isOpen={isConfirmModal} 
        onClose={() => setIsConfirmModal(false)}
        onConfirm={submitNotification}
      />
    </>
  );
}

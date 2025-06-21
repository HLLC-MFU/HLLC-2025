import { Card, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';

type InformationData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  body: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
  imageUrl?: string;
  imageFile?: File;
};

type PushNotificationProp = {
  Information: InformationData;
  Language: 'en' | 'th';
};

export function PushNotification({
  Information,
  Language,
}: PushNotificationProp) {
  const [time, setTime] = useState(new Date());
  const SelectedIcon = Information?.icon;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = time.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return (
    <div className="w-full h-full flex bg-cover bg-center bg-[url('/Bg_phone.png')] justify-center items-start rounded-2xl">
      <Card className="w-[90%] mt-5 ">
        <CardHeader className="flex gap-3 items-center">
          <div className="flex flex-col w-full justify-between">
            <div className="flex items-start gap-4 ">
              <div className="bg-[url('/HLLC.jpg')] bg-cover w-14 aspect-square rounded-xl" />
              <div className="flex flex-col w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {SelectedIcon && (
                    <SelectedIcon className="w-6 h-6 text-black shrink-0" />
                  )}
                  <div className="pr-28 w-80">
                    <p className="text-xl font-medium break-words ">
                      {Information?.title?.[Language] || 'Title'}
                    </p>
                  </div>
                </div>

                <p className="text-lg text-default-500 break-words whitespace-pre-wrap">
                  {Information?.subtitle?.[Language] || 'Subtitle'}
                </p>
              </div>
              <p className="absolute top-4 right-5 text-sm text-gray-500 ">
                {dateString} | {timeString}{' '}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

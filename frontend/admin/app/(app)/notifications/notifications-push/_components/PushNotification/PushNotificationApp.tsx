import { Button, Card, CardBody, CardHeader, Divider , Image } from '@heroui/react';
import { useState, useEffect } from 'react';

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

export function PushNotificationApp({
  Information,
  Language,
}: PushNotificationProp) {
  const [time, setTime] = useState(new Date());
  const SelectedIcon = Information?.icon;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // format: May 31, 2025
  const dateString = time.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // format: 14:20
  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="w-full h-[350px] flex bg-cover bg-center bg-[url('/Bg_test1.png')] justify-center items-center rounded-2xl">
      <Card className="w-[90%] h-[80%] ">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col w-full">
            <div className="flex flex-row justify-between items-center w-full space-x-4">
              <div className="flex items-center gap-2 pr-36">
                {SelectedIcon && (
                  <SelectedIcon className="w-6 h-6 text-black" />
                )}
                <div className="pr-28 w-80">
                  <p className="text-xl font-medium break-words ">
                    {Information?.title?.[Language] || 'Title'}
                  </p>
                </div>
              </div>
              <p className="absolute top-4 right-5 text-sm text-gray-500 whitespace-nowrap">
                {dateString} | {timeString}
              </p>
            </div>
            <div className="pr-36">
              <p className="text-lg text-default-500 whitespace-pre-wrap break-words">
                {Information?.subtitle?.[Language] || 'Subtitle'}
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="relative pt-4 pb-16 pr-24 overflow-auto">
          <div className="pr-8">
            <p className=" text-base whitespace-pre-wrap break-words">
              {Information?.body?.[Language] || 'Description'}
            </p>
          </div>

          {Information?.imageUrl && (
            <div className="absolute top-3 right-5">
              <Image
                src={Information?.imageUrl}
                alt="Logo"
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
          )}

          {Information?.redirect?.en && (
            <div className="absolute bottom-5 right-5">
              <Button
                color="primary"
                className="rounded-2xl"
                onPress={() => window.open(Information.redirect.link, '_blank')}
              >
                {Information?.redirect?.[Language]}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

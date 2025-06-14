import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Image,
  Button,
} from '@heroui/react';
import { useEffect, useState } from 'react';

export function PreviewApp({ info, lang }: { info: any; lang: 'en' | 'th' }) {
  const [now, setNow] = useState(new Date());
  const SelectedIcon = info?.icon;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // format: May 31, 2025
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // format: 14:20
  const timeString = now.toLocaleTimeString('en-US', {
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
                <p className="text-xl font-medium truncate">
                  {info?.title?.[lang] || 'Title'}
                </p>
              </div>
              <p className="absolute top-4 right-5 text-sm text-gray-500 whitespace-nowrap">
                {dateString} | {timeString}
              </p>
            </div>
            <div className="pr-36">
              <p className="text-lg text-default-500 whitespace-pre-wrap break-words">
                {info?.subtitle?.[lang] || 'Subtitle'}
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="relative pt-4 pb-16 pr-24 overflow-auto">
          <div className="pr-8">
            {/* เพิ่ม padding ขวาให้ห่างจากรูป */}
            <p className=" text-base whitespace-pre-wrap break-words">
              {info?.body?.[lang] || 'Description'}
            </p>
          </div>

          {/* รูปที่มุมขวาบน */}
          {info?.imageUrl && (
            <div className="absolute top-3 right-5">
              <Image
                src={info?.imageUrl}
                alt="Logo"
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
          )}

          {/* ปุ่มที่มุมขวาล่าง */}
          {info?.redirect?.en && (
            <div className="absolute bottom-5 right-5">
              <Button
                color="primary"
                className="rounded-2xl"
                onPress={() => window.open(info.redirect.link, '_blank')}
              >
                {info?.redirect?.[lang]}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function PreviewOutApp({
  info,
  lang,
}: {
  info: any;
  lang: 'en' | 'th';
}) {
  const [now, setNow] = useState(new Date()); 
  const SelectedIcon = info?.icon;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // format: May 31, 2025
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // format: 14:20
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return (
    <div className="w-full h-full flex bg-cover bg-center bg-[url('/Bg_phone.png')] justify-center items-start rounded-2xl">
      <Card className="w-[90%] mt-5 ">
        {/* Absolute icon ขวาบน */}

        <CardHeader className="flex gap-3 items-center">
          {/* เนื้อหา */}
          <div className="flex flex-col w-full justify-between">
            <div className="flex items-start gap-4 ">
              <div className="bg-[url('/HLLC.jpg')] bg-cover w-14 aspect-square rounded-xl" />
              <div className="flex flex-col w-full min-w-0">
                {/* Title + Icon */}
                <div className="flex items-center gap-2 min-w-0">
                  {SelectedIcon && (
                    <SelectedIcon className="w-6 h-6 text-black shrink-0" />
                  )}
                  <p className="text-xl font-medium truncate">
                    {info?.title?.[lang] || 'Title'}
                  </p>
                </div>

                {/* Subtitle */}
                <p className="text-lg text-default-500 break-words whitespace-pre-wrap">
                  {info?.subtitle?.[lang] || 'Subtitle'}
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
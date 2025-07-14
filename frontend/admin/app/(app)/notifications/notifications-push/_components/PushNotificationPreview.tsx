import {
  Card,
  CardHeader,
} from '@heroui/react';
import { useEffect, useState } from 'react';

import { NotificationFormData } from "../page";

import { Lang } from '@/types/lang';

type PushNotificationProps = {
  notification: NotificationFormData
  language: keyof Lang
}

export function PushNotificationPreview ({ notification, language }: PushNotificationProps) {

  return (
    <div className="w-full h-full flex bg-cover bg-center bg-[url('/Bg_phone.png')] justify-center items-start rounded-2xl py-5 pb-8">
      <Card className="w-[90%]">

        <CardHeader className="flex gap-3 items-center">
          <div className="flex flex-col w-full justify-between">
            <div className="flex items-start gap-4 ">
              <div className="bg-[url('/HLLC.jpg')] bg-cover w-14 aspect-square rounded-xl" />
              <div className="flex flex-col w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className='pr-28 w-80'>
                    <p className="text-xl font-medium break-words ">
                      {notification.title[language] || '{title}'}
                    </p>
                  </div>
                </div>

                <p className="text-lg text-default-500 break-words whitespace-pre-wrap">
                  {notification.subtitle[language] || '{subtitle}'}
                </p>
              </div>
              <p className="absolute top-4 right-5 text-sm text-gray-500 ">
                Now
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
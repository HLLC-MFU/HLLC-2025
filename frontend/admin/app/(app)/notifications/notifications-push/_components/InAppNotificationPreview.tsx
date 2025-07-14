import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Image,
  Button,
} from '@heroui/react';
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';

import { NotificationFormData } from "../page";

import { Lang } from '@/types/lang';

type InAppNotificationProps = {
  notification: NotificationFormData
  language: keyof Lang
}

export function InAppNotificationPreview({ notification, language }: InAppNotificationProps) {
  const iconName = notification.icon;
  const SelectedIconComponent = iconName && iconName in LucideIcons
    ? LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>
    : null;

  return (
    <div className="w-full flex bg-cover bg-center bg-[url('/Bg_test1.png')] justify-center items-center rounded-2xl">
      <Card className="w-[90%] h-[80%] ">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col w-full">
            <div className="flex flex-row justify-between items-center w-full space-x-4">
              <div className="flex items-center gap-2 pr-36">
                {SelectedIconComponent && <SelectedIconComponent size={24} />}
                <div className='pr-28 w-80'>
                  <p className="text-xl font-medium break-words ">
                    {notification.title[language] || '{title}'}
                  </p>
                </div>
              </div>
              <p className="absolute top-4 right-5 text-sm text-gray-500 whitespace-nowrap">
                Now
              </p>
            </div>
            <div className="pr-36">
              <p className="text-lg text-default-500 whitespace-pre-wrap break-words">
                {notification.subtitle[language] || '{subtitle}'}
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex relative p-4 pt-2 min-h-52">
          <div className={`${notification?.imageURL ? 'pr-24' : ''}`}>
            <p className=" text-base whitespace-pre-wrap break-words">
              {notification.body[language] || '{description}'}
            </p>
          </div>

          {notification?.imageURL && (
            <div className="absolute top-3 right-5">
              <Image
                alt="Logo"
                className="w-20 h-20 rounded-xl object-cover"
                src={notification?.imageURL}
              />
            </div>
          )}

          {(notification.redirectButton?.label.en || notification.redirectButton?.label.th) && (
            <div className="self-end items-end">
              <Button
                className="rounded-2xl"
                color="primary"
                onPress={() => notification.redirectButton?.url ? window.location.href = notification.redirectButton?.url || '#' : null}
              >
                {notification.redirectButton?.label[language]}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
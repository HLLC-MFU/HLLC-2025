'use client';

import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { Card, CardBody, CardHeader } from '@heroui/react';

import { User } from '@/hooks/useProfile';

type QrCodeCardProps = {
  user: User | null;
};

export default function QrCodeCard({ user }: QrCodeCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: user.username,
      image: `pictures/logo-qr.png`,
      dotsOptions: {
        color: '#fff',
        type: 'square',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
      },
      backgroundOptions: {
        color: 'transparent',
      },
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, [user]);

  return (
    <Card className="flex flex-col h-full w-full justify-center border-white/50 border-2 bg-black/20 backdrop-blur p-6 rounded-xl">
      <CardHeader className="flex flex-col text-white">
        <h1 className="text-xl font-bold">
          {user ? `${user.name.first} ${user.name.last}` : 'No name'}
        </h1>
        <p className="text-sm font-bold">
          Student ID: {user?.username || 'No ID'}
        </p>
      </CardHeader>
      <CardBody className="flex flex-col items-center">
        <div ref={qrRef} />
      </CardBody>
    </Card>
  );
}

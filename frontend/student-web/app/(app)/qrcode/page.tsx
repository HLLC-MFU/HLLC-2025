'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@heroui/react';
import { Save } from 'lucide-react';
import { useEffect, useRef } from 'react';

import QRCodeSkeleton from './_components/QRCodeSkeleton';

import { useProfile } from '@/hooks/useProfile';

export default function QRCodePage() {
  const { user, loading, fetchUser } = useProfile();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    link.href = url;
    link.download = `${user?.username ?? 'qrcode'}.png`;
    link.click();
  };

  if (loading || !user) return <QRCodeSkeleton />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 mx-4">
        <div
          className="
            py-8 px-4 rounded-2xl shadow-lg
            bg-black/20
            backdrop-blur-md
            border border-white/30
            flex flex-col items-center justify-center text-center
          "
        >
          <div className="mb-4 gap-0">
            <h1 className="text-2xl font-bold text-white">
              {user?.name.first + ' ' + user?.name.middle + user?.name.last ||
                'Your Name'}
            </h1>
            <p className="font-semibold text-white/80">
              Student ID: {user?.username || '680000000000'}
            </p>
          </div>

          <QRCodeCanvas
            ref={canvasRef}
            bgColor="transparent"
            fgColor="#ffffff"
            size={200}
            value={user?.username ?? ''}
          />

          <div className="mt-4 text-center px-4">
            <p className="text-sm font-bold text-white">
              Please show your QR Code before joining the activity.
            </p>
            <Button
              className="bg-white text-black font-bold px-4 py-2 mt-4"
              radius="full"
              onPress={handleDownload}
            >
              <Save className="mr-2" />
              Download QR Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

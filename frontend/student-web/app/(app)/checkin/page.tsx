'use client';

import QrCodeCard from './_components/QrCodeCard';

import { useProfile } from '@/hooks/useProfile';

export default function CheckinPage() {
  const { user } = useProfile();

  return (
    <div className="flex flex-col min-h-full justify-center">
      <QrCodeCard user={user} />
      {/* button open cam */}
    </div>
  );
}

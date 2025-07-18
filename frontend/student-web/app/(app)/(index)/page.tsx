'use client';

import { useState } from 'react';
import { Bell, Flower } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import GlassButton from '@/components/ui/glass-button';

import { useSseStore } from '@/stores/useSseStore';
import { useAppearances } from '@/hooks/useAppearances';

const baseImageUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  const { assets } = useAppearances();
  const progress = useSseStore(state => state.progress);

  const router = useRouter();

  const steps = 9000;
  // const progressLoading = false;
  const deviceMismatch = false;

  return (
    <div className="relative flex flex-col max-h-full w-full bg-cover bg-center bg-no-repeat text-white pt-6 md:pt-12 pb-28">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <GlassButton iconOnly onClick={() => router.push('/lamduan-flowers')}>
            {assets && assets.lamduanflowers ? (
              <Image
                alt="Lamduan"
                src={`${baseImageUrl}/uploads/${assets.lamduanflowers}`}
                width={20}
                height={20}
              />
            ) : (
              <Flower className="text-white" size={20} />
            )}
          </GlassButton>
          <GlassButton
            iconOnly
            onClick={() => setNotificationModalVisible(true)}
          >
            {assets && assets.notification ? (
              <Image
                alt="Notification"
                src={`${baseImageUrl}/uploads/${assets.notification}`}
                width={20}
                height={20}
              />
            ) : (
              <Bell className="text-white" size={20} />
            )}
          </GlassButton>
        </div>
      </div>

      {/* ลบ PretestQuestionModal และ PosttestQuestionModal ออกให้หมด */}
    </div>
  );
}

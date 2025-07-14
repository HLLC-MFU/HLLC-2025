'use client';

import { useState } from 'react';
import { Bell, Coins, Flower, Footprints } from 'lucide-react';

import { ProgressSummaryCard } from './_components/ProgressSummaryCard';

import GlassButton from '@/components/ui/glass-button';

const baseImageUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  const steps = 9000; // fetch this from API
  const progressPercentage = 75;
  const progressLoading = false;
  const deviceMismatch = false;

  const assetsImage = {
    lamduan: null,
    profile: null,
    notification: null,
    background: null,
    progress: null,
  };

  const subFabs = [
    {
      key: 'step',
      icon: <Footprints className="text-white" size={18} />,
      label: 'Step',
      onClick: () => (window.location.href = '/community/step-counter'),
    },
    {
      key: 'coin',
      icon: <Coins className="text-white" size={18} />,
      label: 'Coin',
      onClick: () => (window.location.href = '/coin-hunting'),
    },
    {
      key: 'lamduanflowers',
      icon: <Flower className="text-white" size={18} />,
      label: 'Lamduan',
      onClick: () => (window.location.href = '/coin-hunting'),
    },
  ];

  return (
    <div
      className="relative flex flex-col max-h-full w-full bg-cover bg-center bg-no-repeat text-white px-4 pt-6 md:pt-12 pb-28"
      style={{
        backgroundImage: `url(${baseImageUrl}/uploads/${assetsImage.background || 'default-bg.jpg'})`,
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <GlassButton iconOnly>
            <Flower
              className="text-white"
              size={20}
              onClick={() => (window.location.href = '/lamduanflowers')}
            />
          </GlassButton>
          <GlassButton
            iconOnly
            onClick={() => setNotificationModalVisible(true)}
          >
            <Bell className="text-white" size={20} />
          </GlassButton>
        </div>
      </div>
      {/* 
      <GooeyFabMenu className="absolute bottom-24 left-4" subFabs={subFabs} />

      <NotificationModal
        open={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      /> */}
    </div>
  );
}

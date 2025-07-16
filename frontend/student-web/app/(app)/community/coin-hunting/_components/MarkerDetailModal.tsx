"use client"

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lang } from '@/types/lang';
import { useLanguage } from '@/context/LanguageContext';
import { X, ScanQrCode } from 'lucide-react';

interface Marker {
  x: number;
  y: number;
  image: string;
  description: Lang;
  mapsUrl: string;
}

interface MarkerDetailModalProps {
  visible: boolean;
  marker: Marker | null;
  onClose: () => void;
  onCheckIn: () => void;
}

export default function MarkerDetailModal({
  visible,
  marker,
  onClose,
  onCheckIn,
}: MarkerDetailModalProps) {
  const router = useRouter();
  const { language } = useLanguage();

  if (!visible || !marker) return null;

  const description =
    marker.description?.[language] || marker.description?.th || marker.description?.en || '';

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-6 w-[320px] text-white shadow-xl">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Image */}
        <div className="w-full h-[140px] relative rounded-lg overflow-hidden mb-4">
          <Image
            src={marker.image}
            alt="marker"
            fill
            className="object-cover"
          />
        </div>

        {/* Description */}
        <p
          className="text-center text-sm mb-4 max-h-24 overflow-y-auto"
          style={{ wordBreak: 'break-word' }}
        >{description}</p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-md text-sm font-semibold min-w-[120px]"
            onClick={() => window.open(marker.mapsUrl, '_blank')}
          >
            <Image
              src="/images/google.png"
              alt="Google Maps"
              width={20}
              height={20}
              className="object-contain"
            />
            Google Maps
          </button>

          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-semibold min-w-[120px]"
            onClick={() => {
              onClose();
              setTimeout(() => {
                router.push('/qrcode?tab=scan');
              }, 200);
            }}
          >
            <ScanQrCode className="w-5 h-5" />
            Check in Now
          </button>
        </div>
      </div>
    </div>
  );
}

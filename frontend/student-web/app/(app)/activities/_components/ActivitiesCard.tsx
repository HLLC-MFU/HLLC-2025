'use client';

import type { UserActivity } from '@/types/activities';

import { Card } from '@heroui/react';
import Image from 'next/image';

import { getStatusBadge } from '../_utils/getStatusBadge';

interface ActivityCardProps {
  activity: UserActivity;
  onClick?: () => void;
}

export default function ActivityCard({ activity, onClick }: ActivityCardProps) {
  if (!activity) return null;
  const {
    label,
    color,
    icon: Icon,
  } = getStatusBadge({
    checkinStatus: activity.checkinStatus,
    hasAnsweredAssessment: activity.hasAnsweredAssessment,
  });

  return (
    <div
      className="w-full mb-5 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Card className="rounded-[32px] overflow-hidden shadow-xl bg-white">
        <div className="relative h-[400px]">
          <Image
            fill
            alt={activity.name.en}
            className="object-cover"
            // src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`
            src={`https://hllc.mfu.ac.th/api/uploads/${activity.photo?.bannerPhoto || 'default-banner.jpg'}`}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80" />

          {/* Top-right status badge */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-end">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: color }}
            >
              <Icon color="white" size={14} />
              <span className="text-white text-xs font-semibold">{label}</span>
            </div>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="mb-3">
              <h2 className="text-white text-2xl font-bold drop-shadow-sm">
                {activity.name.en}
              </h2>
            </div>
            <p className="text-white/90 text-sm leading-5 mb-4 drop-shadow-sm">
              {activity.location.en} • Experience an amazing adventure with
              stunning views and unforgettable memories.
            </p>
            {activity.metadata?.startAt && (
              <div className="inline-block px-3 py-1.5 rounded-xl border border-white/30 bg-white/20">
                <span className="text-white text-xs font-semibold">
                  {new Date(activity.metadata.startAt).toLocaleString(
                    undefined,
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    },
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

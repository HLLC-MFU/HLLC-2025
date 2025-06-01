'use client';

import { Campaign } from '@/types/campaign';
import { addToast } from '@heroui/react';
import { useState } from 'react';

interface CampaignPreviewProps {
  campaign: Campaign;
  className?: string;
}

export const CampaignPreview = ({
  campaign,
  className = '',
}: CampaignPreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Helper function to construct image URL
  const getImageUrl = (
    image: { filename?: string; url?: string } | undefined,
  ) => {
    if (!image) return '';
    const filename = image.filename || image.url;
    if (!filename) return '';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    // Remove trailing slash if exists
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Remove /api from the base URL if it exists
    const apiBaseUrl = cleanBaseUrl.replace(/\/api$/, '');
    return `${apiBaseUrl}/uploads/${filename}`;
  };

  console.log('CampaignPreview received campaign:', campaign);
  console.log('Image URL:', getImageUrl(campaign.image));

  if (!campaign) {
    console.log('Campaign is null or undefined');
    addToast({
      title: 'ไม่พบข้อมูลแคมเปญ',
      color: 'danger',
      description: 'ไม่สามารถแสดงข้อมูลแคมเปญได้',
      variant: 'solid',
    });
    return (
      <div className="w-full h-full p-6 flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            No campaign data available
          </p>
          <p className="text-gray-400 text-sm mt-1">
            กรุณาเลือกแคมเปญเพื่อดูรายละเอียด
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
          icon: '🟢',
          label: 'Active',
        };
      case 'completed':
        return {
          color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: '✅',
          label: 'Completed',
        };
      case 'draft':
        return {
          color: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          icon: '📝',
          label: 'Draft',
        };
      default:
        return {
          color: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          icon: '❓',
          label: 'Unknown',
        };
    }
  };

  const statusInfo = getStatusInfo(campaign.status);

  // Calculate progress (example logic - adjust based on your needs)
  const calculateProgress = () => {
    if (!campaign.startAt || !campaign.endAt) return 0;
    const start = new Date(campaign.startAt).getTime();
    const end = new Date(campaign.endAt).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  const progress = calculateProgress();

  try {
    return (
      <div
        className={`w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      >
        {/* Campaign Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 overflow-hidden">
          {campaign.image && (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              )}
              {!imageError ? (
                <img
                  src={getImageUrl(campaign.image)}
                  alt={campaign.name?.th || campaign.name?.en || 'Campaign'}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm">Image not available</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Status Badge Overlay */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${statusInfo.color}`}
            >
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
              {campaign.name?.th || campaign.name?.en || 'Untitled Campaign'}
            </h3>

            {campaign.detail?.th && (
              <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                {campaign.detail.th}
              </p>
            )}
          </div>

          {/* Campaign Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Duration */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Duration
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {campaign.startAt && campaign.endAt
                  ? `${new Date(campaign.startAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })} - ${new Date(campaign.endAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                      },
                    )}`
                  : 'Not set'}
              </p>
            </div>

            {/* Budget */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Budget
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {campaign.budget
                  ? `฿${campaign.budget.toLocaleString()}`
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {campaign.status === 'active' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Campaign Progress
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>
                  Created:{' '}
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString('th-TH')
                    : 'Unknown'}
                </span>
              </div>
              {campaign.updatedAt && (
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>
                    Modified:{' '}
                    {new Date(campaign.updatedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering campaign preview:', error);
    addToast({
      title: 'เกิดข้อผิดพลาด',
      color: 'danger',
      description: 'ไม่สามารถแสดงข้อมูลแคมเปญได้ กรุณาลองใหม่อีกครั้ง',
      variant: 'solid',
    });
    return (
      <div className="w-full h-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">
            ไม่สามารถแสดงข้อมูลแคมเปญได้
          </p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">กรุณาลองใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }
};

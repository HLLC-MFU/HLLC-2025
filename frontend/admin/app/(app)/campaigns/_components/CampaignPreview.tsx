"use client";

import { Campaign } from "@/types/campaign";
import { addToast } from "@heroui/react";

interface CampaignPreviewProps {
  campaign: Campaign;
}

export const CampaignPreview = ({ campaign }: CampaignPreviewProps) => {
  console.log("CampaignPreview received campaign:", campaign);

  if (!campaign) {
    console.log("Campaign is null or undefined");
    addToast({
      title: "ไม่พบข้อมูลแคมเปญ",
      color: "danger",
      description: "ไม่สามารถแสดงข้อมูลแคมเปญได้",
      variant: "solid",
    });
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <p className="text-gray-500">No campaign data available</p>
      </div>
    );
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  try {
    return (
      <div className="w-full h-full p-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
              {campaign.name?.th || campaign.name?.en || 'Untitled Campaign'}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
              {campaign.status || 'Unknown'}
            </span>
          </div>
          
          {campaign.detail?.th && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {campaign.detail.th}
            </p>
          )}
        </div>

        {/* Campaign Details */}
        <div className="space-y-3">
          {/* Date Range */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duration</span>
            <span className="text-gray-700 font-medium">
              {campaign.startAt && campaign.endAt ? (
                `${new Date(campaign.startAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - ${new Date(campaign.endAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}`
              ) : (
                'Not set'
              )}
            </span>
          </div>

          {/* Budget */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Budget</span>
            <span className="text-gray-700 font-medium">
              {campaign.budget ? (
                `฿${campaign.budget.toLocaleString()}`
              ) : (
                'Not set'
              )}
            </span>
          </div>

          {/* Progress Bar (if you have progress data) */}
          {campaign.status === 'active' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with additional info */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Created: {campaign.createdAt ? 
                new Date(campaign.createdAt).toLocaleDateString() : 
                'Unknown'
              }
            </span>
            {campaign.updatedAt && (
              <span>
                Modified: {new Date(campaign.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering campaign preview:", error);
    addToast({
      title: "เกิดข้อผิดพลาด",
      color: "danger",
      description: "ไม่สามารถแสดงข้อมูลแคมเปญได้ กรุณาลองใหม่อีกครั้ง",
      variant: "solid",
    });
    return (
      <div className="w-full h-full p-4">
        <p className="text-gray-500">ไม่สามารถแสดงข้อมูลแคมเปญได้</p>
      </div>
    );
  }
};
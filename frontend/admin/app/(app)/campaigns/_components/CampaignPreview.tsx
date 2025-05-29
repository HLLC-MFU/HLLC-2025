"use client";

import { Campaign } from "@/types/campaign";
import { Card, CardBody, CardHeader } from "@heroui/react";

interface CampaignPreviewProps {
  campaign: Campaign;
}

export const CampaignPreview = ({ campaign }: CampaignPreviewProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">{campaign.name}</p>
          <p className="text-small text-default-500">{campaign.status}</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-semibold">Start Date: </span>
            {new Date(campaign.startDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">End Date: </span>
            {new Date(campaign.endDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Budget: </span>
            {campaign.budget.toLocaleString()} THB
          </div>
          <div>
            <span className="font-semibold">Description: </span>
            {campaign.description}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 
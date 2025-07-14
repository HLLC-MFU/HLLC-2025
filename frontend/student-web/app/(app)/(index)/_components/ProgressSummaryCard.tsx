'use client';

import { Card, Progress } from '@heroui/react';
import { Footprints, Award, CircleAlert, User } from 'lucide-react';

export function ProgressSummaryCard({
  healthData = { steps: 0, deviceMismatch: false },
  progressImage = null, // Relative path like "image.jpg"
  onClick = () => {},
  progressPercentage = 0,
  progressLoading = false,
}) {
  return (
    <Card
      className="fixed top-0 z-50 bg-transparent backdrop-blur-md border border-white/30 shadow-lg p-4 flex flex-col gap-4"
      isPressable={true}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {progressImage ? (
          <img alt="progress" className="w-6 h-6" src={progressImage} />
        ) : (
          <User className="text-white" size={20} />
        )}
        <span className="text-sm font-semibold text-white">Progress</span>
      </div>

      <div className="flex items-center gap-2">
        <Progress className="w-32 bg-white/20" value={progressPercentage} />
        <span className="text-sm text-white">
          {progressLoading ? '...' : `${progressPercentage}%`}
        </span>
      </div>

      <div className="flex justify-between items-center text-white text-sm">
        <div className="flex items-center gap-1">
          <Footprints size={14} />
          {healthData.steps}
          {healthData.deviceMismatch && <CircleAlert size={14} />}
        </div>
        <div className="h-4 w-px bg-white/40" />
        <div className="flex items-center gap-1">
          <Award size={14} />
          85
        </div>
      </div>
    </Card>
  );
}

import {
  AlertCircle,
  QrCode,
  CheckCircle,
  FileText,
  Hourglass,
  CalendarClock,
  LucideIcon,
} from 'lucide-react';

export interface ActivityStatusInput {
  checkinStatus: number;
  hasAnsweredAssessment?: boolean;
}

export interface ActivityStatusOutput {
  label: string;
  color: string; // Tailwind-compatible hex or class (e.g. text-green-500)
  icon: LucideIcon;
}

/**
 * Maps activity check-in status and assessment state to a badge label, color, and icon.
 */
export function getStatusBadge(
  activity: ActivityStatusInput,
): ActivityStatusOutput {
  switch (activity.checkinStatus) {
    case 0:
      return {
        label: 'Not Open',
        color: '#facc15', // Yellow-400
        icon: Hourglass,
      };
    case 1:
      return {
        label: 'Available for Check-in',
        color: '#3b82f6', // Blue-500
        icon: QrCode,
      };
    case 2:
      return {
        label: 'Checked In',
        color: '#10b981', // Green-500
        icon: CheckCircle,
      };
    case 3:
      return activity.hasAnsweredAssessment
        ? {
            label: 'Success',
            color: '#22c55e', // Green-400
            icon: CheckCircle,
          }
        : {
            label: 'Waiting for Assessment',
            color: '#f59e0b', // Amber-500
            icon: FileText,
          };
    case -1:
      return {
        label: 'Missed',
        color: '#ef4444', // Red-500
        icon: AlertCircle,
      };
    default:
      return {
        label: 'Available',
        color: '#3b82f6', // Blue-500
        icon: CalendarClock,
      };
  }
}

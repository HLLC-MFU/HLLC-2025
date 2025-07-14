import {
  AlertCircle,
  QrCode,
  CheckCircle,
  FileText,
  Hourglass,
  CalendarClock,
} from "@tamagui/lucide-icons"

export interface ActivityStatusInput {
  checkinStatus: number
  hasAnsweredAssessment?: boolean
}

export interface ActivityStatusOutput {
  label: string
  color: string
  icon: React.ComponentType<any> // Accepts a Lucide icon component
}

/**
 * Maps activity check-in status and assessment state to a badge label, color, and icon.
 */
export function getStatusBadge(activity: ActivityStatusInput): ActivityStatusOutput {
  switch (activity.checkinStatus) {
    case 0:
      return {
        label: "Not Open",
        color: "#facc15", // Yellow
        icon: Hourglass,
      }
    case 1:
      return {
        label: "Available for Check-in",
        color: "#3b82f6", // Blue
        icon: QrCode,
      }
    case 2:
      return {
        label: "Checked In",
        color: "#10b981", // Green
        icon: CheckCircle,
      }
    case 3:
      return activity.hasAnsweredAssessment
        ? {
            label: "Success",
            color: "#22c55e", // Bright Green
            icon: CheckCircle,
          }
        : {
            label: "Waiting for Assessment",
            color: "#f59e0b", // Amber
            icon: FileText,
          }
    case -1:
      return {
        label: "Missed",
        color: "#ef4444", // Red
        icon: AlertCircle,
      }
    default:
      return {
        label: "Available",
        color: "#3b82f6",
        icon: CalendarClock,
      }
  }
}

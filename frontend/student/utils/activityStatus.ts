import { useLanguage } from "@/context/LanguageContext"
import {
  AlertCircle,
  QrCode,
  CheckCircle,
  FileText,
  Hourglass,
  CalendarClock,
} from "@tamagui/lucide-icons"
import { useTranslation } from "react-i18next"

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
  const { t} = useTranslation()
  switch (activity.checkinStatus) {
    case 0:
      return {
        label: t("activity.notOpenYet"), // "Not open yet"
        color: "#222831", // Yellow
        icon: Hourglass,
      }
    case 1:
      return {
        label: t("activity.checkinAvailable"), // "Available for Check-in"
        color: "#3b82f6", // Blue
        icon: QrCode,
      }
    case 2:
      return {
        label: t("activity.checkedIn"), // "Checked In"
        color: "#10b981", // Green
        icon: CheckCircle,
      }
    case 3:
      return activity.hasAnsweredAssessment
        ? {
            label: t("activity.success"), // "Success"
            color: "#22c55e", // Bright Green
            icon: CheckCircle,
          }
        : {
            label: t("activity.waitingForAssessment"), // "Waiting for Assessment"
            color: "#f59e0b", // Amber
            icon: FileText,
          }
    case -1:
      return {
        label: t("activity.missed"), // "Missed"
        color: "#ef4444", // Red
        icon: AlertCircle,
      }
    default:
      return {
        label: t("activity.unknownStatus"), // "Unknown Status"
        color: "#3b82f6",
        icon: CalendarClock,
      }
  }
}

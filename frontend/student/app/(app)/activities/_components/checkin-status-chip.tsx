import { AlertCircle, CheckCheck, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react-native"
import React, { useEffect } from "react"
import { Text, View, StyleSheet, Animated, Platform } from "react-native"


type CheckinStatusMeta = {
  label: string
  message: string
  color: string
  backgroundColor: string
  icon: React.ReactNode
}

const getCheckinStatusMeta = (status: number): CheckinStatusMeta => {
  switch (status) {
    case 0:
      return {
        label: "Not yet open",
        message: "Not yet open for check-in",
        color: "#4b5563", // darker gray for better contrast
        backgroundColor: "#f3f4f6", // light gray background
        icon: <Clock stroke="#4b5563" width={16} height={16} />,
      }
    case 1:
      return {
        label: "Check-in Available",
        message: "Check-in available now",
        color: "#854d0e", // darker yellow for better contrast
        backgroundColor: "#fef9c3", // light yellow background
        icon: <AlertCircle stroke="#854d0e" width={16} height={16} />,
      }
    case 2:
      return {
        label: "Checked in",
        message: "You have already checked in",
        color: "#1d4ed8", // darker blue for better contrast
        backgroundColor: "#dbeafe", // light blue background
        icon: <CheckCircle2 stroke="#1d4ed8" width={16} height={16} />,
      }
    case 3:
      return {
        label: "Success",
        message: "Activity has ended",
        color: "#15803d", // darker green for better contrast
        backgroundColor: "#dcfce7", // light green background
        icon: <CheckCheck stroke="#15803d" width={16} height={16} />,
      }
    case -1:
      return {
        label: "Missed",
        message: "You missed the check-in time",
        color: "#b91c1c", // darker red for better contrast
        backgroundColor: "#fee2e2", // light red background
        icon: <XCircle stroke="#b91c1c" width={16} height={16} />,
      }
    default:
      return {
        label: "Unknown",
        message: "Unknown status",
        color: "#6b7280", // medium gray for better contrast
        backgroundColor: "#f3f4f6", // light gray background
        icon: <HelpCircle stroke="#6b7280" width={16} height={16} />,
      }
  }
}

type Props = {
  status: number
  size?: "sm" | "md" | "lg"
  withLabel?: boolean
  withAnimation?: boolean
  onPress?: () => void
}

export default function CheckinStatusChip ({
  status,
  size = "md",
  withLabel = true,
  withAnimation = true,
  onPress,
}: Props): React.ReactElement {
  const { label, color, backgroundColor, icon } = getCheckinStatusMeta(status)
  const scaleAnim = new Animated.Value(0.95)

  useEffect(() => {
    if (withAnimation) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [status, withAnimation])

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 10,
          iconSize: 12,
        }
      case "lg":
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 18,
        }
      default: // "md"
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 16,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          transform: [{ scale: scaleAnim }],
        },
        onPress && styles.pressable,
      ]}
      accessibilityLabel={`Status: ${label}`}
      accessibilityRole={onPress ? "button" : "text"}
    >
      <View style={styles.iconContainer}>
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ width?: number; height?: number }>,
              {
                width: sizeStyles.iconSize,
                height: sizeStyles.iconSize,
              }
            )
          : icon}
      </View>
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {withLabel ? label : status.toString()}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
      },
    }),
  },
  pressable: {
    opacity: 0.9,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
})

import type React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Check, AlertCircle, ChevronRight } from "@tamagui/lucide-icons"

interface StepperItemProps {
  index: number
  label: string
  active: boolean
  completed?: boolean
  error?: boolean
  isLast?: boolean
  disabled?: boolean
  description?: string | React.ReactNode
  children?: React.ReactNode
  icon?: any
  onPress?: () => void
}

function StepperItem({
  index,
  label,
  active,
  completed = false,
  error = false,
  isLast = false,
  disabled = false,
  description,
  children,
  icon: IconComponent,
  onPress,
}: StepperItemProps) {
  const getStepConfig = () => {
    if (disabled) {
      return {
        circle: {
          bg: ["#f8fafc", "#f1f5f9"],
          border: "#e2e8f0",
          shadow: "rgba(0,0,0,0.05)",
        },
        text: "#94a3b8",
        line: "#e2e8f0",
        accent: "#64748b",
        contentBg: "#f8fafc",
        contentBorder: "#e2e8f0",
      }
    }

    if (error) {
      return {
        circle: {
          bg: ["#fef2f2", "#fee2e2"],
          border: "#f87171",
          shadow: "rgba(248, 113, 113, 0.2)",
        },
        text: "#dc2626",
        line: "#f87171",
        accent: "#ef4444",
        contentBg: "#fef2f2",
        contentBorder: "#fca5a5",
      }
    }

    if (completed) {
      return {
        circle: {
          bg: ["#10b981", "#059669"],
          border: "#10b981",
          shadow: "rgba(16, 185, 129, 0.3)",
        },
        text: "#ffffff",
        line: "#10b981",
        accent: "#059669",
        contentBg: "#f0fdf4",
        contentBorder: "#10b981",
      }
    }

    if (active) {
      return {
        circle: {
          bg: ["#3b82f6", "#2563eb"],
          border: "#3b82f6",
          shadow: "rgba(59, 130, 246, 0.3)",
        },
        text: "#ffffff",
        line: "#3b82f6",
        accent: "#2563eb",
        contentBg: "#eff6ff",
        contentBorder: "#3b82f6",
      }
    }

    return {
      circle: {
        bg: ["#ffffff", "#f8fafc"],
        border: "#d1d5db",
        shadow: "rgba(0,0,0,0.1)",
      },
      text: "#6b7280",
      line: "#d1d5db",
      accent: "#9ca3af",
      contentBg: "#f9fafb",
      contentBorder: "#d1d5db",
    }
  }

  const config = getStepConfig()
  const isInteractive = onPress && !disabled

  const StepContent = () => (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      {/* Timeline Column */}
      <View style={{ alignItems: "center", marginRight: 16, minHeight: 80 }}>
        {/* Step Circle */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 2,
            borderColor: config.circle.border,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: config.circle.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={
              Array.isArray(config.circle.bg)
                ? config.circle.bg as unknown as readonly [import("react-native").ColorValue, import("react-native").ColorValue, ...import("react-native").ColorValue[]]
                : [config.circle.bg, config.circle.bg] as readonly [import("react-native").ColorValue, import("react-native").ColorValue, ...import("react-native").ColorValue[]]
            }
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {completed ? (
            <Check size={24} color={config.text} strokeWidth={3} />
          ) : error ? (
            <AlertCircle size={24} color={config.text} strokeWidth={2.5} />
          ) : IconComponent ? (
            <IconComponent size={24} color={config.text} strokeWidth={2} />
          ) : (
            <Text
              style={{
                color: config.text,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {index}
            </Text>
          )}
        </View>

        {/* Connecting Line */}
        {!isLast && (
          <View
            style={{
              width: 3,
              flex: 1,
              minHeight: 10,
              backgroundColor: config.line,
              marginTop: 12,
              borderRadius: 1.5,
              opacity: completed || active ? 1 : 0.4,
            }}
          />
        )}
      </View>

      {/* Content Column */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: disabled ? config.text : "#111827",
                lineHeight: 24,
                marginBottom: 2,
              }}
            >
              {label}
            </Text>
          </View>

          {isInteractive && <ChevronRight size={20} color={config.accent} />}
        </View>

        {/* Description */}
        {(active || completed || error) && description && (
          <View
            style={{
              backgroundColor: config.contentBg,
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: config.contentBorder,
              marginTop: 8,
              shadowColor: "rgba(0,0,0,0.05)",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {typeof description === "string" ? (
              <Text
                style={{
                  color: "#374151",
                  fontSize: 15,
                  lineHeight: 22,
                  fontWeight: "400",
                }}
              >
                {description}
              </Text>
            ) : (
              description
            )}
          </View>
        )}

        {/* Interactive Content */}
        {active && children && <View style={{ marginTop: 16 }}>{children}</View>}
      </View>
    </View>
  )

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          marginBottom: isLast ? 0 : 24,
          borderRadius: 16,
          padding: 4,
        }}
        activeOpacity={0.7}
      >
        <StepContent />
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ marginBottom: isLast ? 0 : 24 }}>
      <StepContent />
    </View>
  )
}

export default StepperItem

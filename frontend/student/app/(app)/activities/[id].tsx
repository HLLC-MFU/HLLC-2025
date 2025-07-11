"use client"

import { router } from "expo-router"
import { useActivityStore } from "@/stores/activityStore"
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { Button, Separator } from "tamagui"
import { ArrowLeft, Compass, Clock, QrCode, CheckCircle, FileText } from "@tamagui/lucide-icons"
import CheckinStatusChip from "./_components/checkin-status-chip"
import DateBadge from "./_components/date-badge"
import type React from "react"
import { useState } from "react"

function StepperItem({
  index,
  label,
  active,
  completed,
  error,
  isLast,
  disabled,
  description,
  children,
  icon: IconComponent,
}: {
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
}) {
  const getColors = () => {
    if (disabled) return { bg: "#f8f9fa", border: "#e9ecef", text: "#6c757d", line: "#e9ecef" }
    if (error) return { bg: "#fee2e2", border: "#fca5a5", text: "#dc2626", line: "#fca5a5" }
    if (active) return { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8", line: "#3b82f6" }
    if (completed) return { bg: "#d1fae5", border: "#10b981", text: "#059669", line: "#10b981" }
    return { bg: "#f8f9fa", border: "#d1d5db", text: "#6b7280", line: "#d1d5db" }
  }

  const colors = getColors()

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: isLast ? 0 : 24 }}>
      {/* Icon + Line Container */}
      <View style={{ flexDirection: "column", alignItems: "center", marginRight: 16 }}>
        {/* Icon Circle */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.bg,
            borderWidth: 2,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {IconComponent ? (
            <IconComponent size={20} color={colors.text} />
          ) : (
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>{index}</Text>
          )}
        </View>

        {/* Vertical line */}
        {!isLast && (
          <View
            style={{
              width: 2,
              height: 32,
              backgroundColor: colors.line,
              marginTop: 8,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text
          style={{
            color: colors.text,
            fontWeight: "600",
            fontSize: 16,
            lineHeight: 24,
            marginBottom: 4,
          }}
        >
          {label}
        </Text>

        {(active || completed) && description && (
          <View
            style={{
              backgroundColor: active ? "#f0f9ff" : completed ? "#f0fdf4" : "#f9fafb",
              padding: 12,
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: colors.border,
              marginTop: 8,
            }}
          >
            {typeof description === "string" ? (
              <Text style={{ color: "#374151", fontSize: 14, lineHeight: 20 }}>{description}</Text>
            ) : (
              description
            )}
          </View>
        )}

        {active && children && <View style={{ marginTop: 12 }}>{children}</View>}
      </View>
    </View>
  )
}

export default function ActivityDetailPage() {
  const activity = useActivityStore((s) => s.selectedActivity)
  const [selectedTab, setSelectedTab] = useState<"details" | "timeline">("details")

  if (!activity) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#999" }}>No activity data found.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Image Section */}
      <View style={{ position: "relative", width: "100%", aspectRatio: 4 / 3 }}>
        <View id={`activity-image-${activity._id}`} style={{ width: "100%", height: "100%" }}>
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}` }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <LinearGradient
          colors={["transparent", "#ffffff80", "#ffffff"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
          }}
          pointerEvents="none"
        />
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: 8,
            borderRadius: 999,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft color="#333" size={20} />
        </TouchableOpacity>
      </View>

      {/* Tab Header */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={() => setSelectedTab("details")}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: selectedTab === "details" ? "#000" : "#aaa",
              borderBottomWidth: selectedTab === "details" ? 2 : 0,
              borderColor: "#000",
              paddingBottom: 4,
            }}
          >
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab("timeline")}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: selectedTab === "timeline" ? "#000" : "#aaa",
              borderBottomWidth: selectedTab === "timeline" ? 2 : 0,
              borderColor: "#000",
              paddingBottom: 4,
            }}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === "details" && (
        <View style={{ padding: 20, gap: 20 }}>
          {/* Title & Info */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: "#888", textTransform: "uppercase" }}>Activity</Text>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#222" }}>{activity.name.en}</Text>
              <Text style={{ fontSize: 15, color: "#666" }}>
                Start at{" "}
                {new Date(activity.metadata.startAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
              <Text style={{ fontSize: 15, color: "#666" }}>{activity.location.en}</Text>
              <CheckinStatusChip status={activity.checkinStatus} />
            </View>
            <View style={{ flexDirection: "column", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <DateBadge date={activity.metadata.startAt} />
            </View>
          </View>
          <Separator />
          {/* Description */}
          <View>
            <Text style={{ fontSize: 16, lineHeight: 24, color: "#444", textAlign: "justify" }}>
              {activity.fullDetails.en}
            </Text>
          </View>
          <Separator />
          {/* Action Button */}
          <Button
            onPress={() => Linking.openURL("https://maps.app.goo.gl/CWfVTpiP9Xu9BZx4A")}
            icon={Compass}
            style={{
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}
          >
            Get Direction
          </Button>
        </View>
      )}

      {selectedTab === "timeline" && (
        <ScrollView
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 72, marginBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Timeline Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
              Activity Progress
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Track your participation status and next steps</Text>
          </View>

          <View style={{ paddingBottom: 20 }}>
            {/* Step 1: Activity Start */}
            <StepperItem
              index={1}
              icon={Clock}
              label={activity.checkinStatus === 0 ? "Waiting to Start" : "Activity Started"}
              active={activity.checkinStatus === 0}
              completed={activity.checkinStatus > 0}
              error={activity.checkinStatus < 0}
              disabled={activity.checkinStatus === 0}
              description={
                activity.checkinStatus < 0
                  ? "This activity has not opened yet. Please wait until the scheduled start time."
                  : `Activity begins at ${new Date(activity.metadata.startAt).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}. Please be ready to participate.`
              }
            >
              {activity.checkinStatus === 0 && (
                <View
                  style={{
                    backgroundColor: "#fef3c7",
                    padding: 12,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: "#f59e0b",
                  }}
                >
                  <Text style={{ color: "#92400e", fontSize: 14, lineHeight: 20 }}>
                    ⏳ Check back when the activity starts to proceed with check-in.
                  </Text>
                </View>
              )}
            </StepperItem>

            {/* Step 2: Check-in */}
            <StepperItem
              index={2}
              icon={QrCode}
              label="Check-In Required"
              active={activity.checkinStatus === 1}
              completed={activity.checkinStatus >= 2}
              error={activity.checkinStatus < 0}
              disabled={activity.checkinStatus === 0}
              description="Scan the QR code at the event location or visit the designated check-in point to confirm your attendance."
            >
              {activity.checkinStatus === 1 && (
                <Button
                  size="$3"
                  backgroundColor="#3b82f6"
                  color="white"
                  borderRadius={8}
                  marginTop={4}
                  onPress={() => router.replace(`/qrcode`)}
                  icon={QrCode}
                >
                  Open QR Scanner
                </Button>
              )}
            </StepperItem>

            {/* Step 3: Checked In */}
            <StepperItem
              index={3}
              icon={CheckCircle}
              label={activity.checkinStatus === 3 ? "Activity Completed" : "Successfully Checked In"}
              active={activity.checkinStatus === 2}
              completed={activity.checkinStatus === 3}
              error={activity.checkinStatus < 0}
              disabled={activity.checkinStatus === 0}
              description={
                activity.checkinStatus === 3
                  ? "Congratulations! You've completed the activity. Please take a moment to share your feedback through the assessment."
                  : "Great! You're all set. Enjoy the activity and stay engaged throughout the session."
              }
            />

            {/* Step 4: Assessment */}
            <StepperItem
              index={4}
              icon={FileText}
              label="Post-Activity Assessment"
              active={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
              completed={activity.hasAnsweredAssessment}
              error={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
              disabled={activity.checkinStatus < 3}
              isLast
              description="Help us improve by sharing your experience and feedback about this activity."
            >
              <View
                style={{
                  backgroundColor: "#f0f9ff",
                  padding: 12,
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: "#3b82f6",
                }}
              >
                <Text style={{ color: "#1e40af", fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
                  💭 Your feedback is valuable and helps us create better experiences for everyone.
                </Text>
                {!activity.hasAnsweredAssessment && activity.checkinStatus === 3 && (
                  <Button
                    size="$3"
                    backgroundColor="#10b981"
                    color="white"
                    borderRadius={8}
                    onPress={() => console.log("Go to assessment")}
                    icon={FileText}
                  >
                    Complete Assessment
                  </Button>
                )}
              </View>
            </StepperItem>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

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
import { useTranslation } from "react-i18next"
import StepperItem from "@/components/activities/stepper-item"


export default function ActivityDetailPage() {
  const activity = useActivityStore((s) => s.selectedActivity)
  const [selectedTab, setSelectedTab] = useState<"details" | "timeline">("details")
  const { t } = useTranslation()
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
          onPress={() => router.push("/activities")}
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
            {t("activity.detailTab")}
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
            {t("activity.TimelineTab")}
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
            onPress={() => Linking.openURL(activity.location.mapUrl)}
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
              label={
                activity.checkinStatus < 0
                  ? "Activity Missed"
                  :
                  activity.checkinStatus === 0
                    ? "Waiting to Start"
                    : activity.checkinStatus > 0
                      ? "Activity Started"
                      : "Activity Ended"
              }
              active={activity.checkinStatus === 0}
              completed={activity.checkinStatus > 0}
              error={activity.checkinStatus < 0}
              disabled={activity.checkinStatus === 0}
              description={
                activity.checkinStatus !== 0
                  ? activity.checkinStatus < 0
                    ? 'You missed the activity. If you were unable to check in due to a technical problem or other reason, please reach out to MFU Activity.'
                    : `Activity begins at ${new Date(activity.metadata.startAt).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}. Please be ready to participate.`
                  : undefined
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
            {
              activity.checkinStatus !== -1 && (
                <StepperItem
                  index={2}
                  icon={QrCode}
                  label={activity.checkinStatus < 0 ? "Cannot Check-In" : "Check-In Required"}
                  active={activity.checkinStatus === 1}
                  completed={activity.checkinStatus >= 2}
                  error={activity.checkinStatus < 0}
                  disabled={activity.checkinStatus === 0}
                  description={activity.checkinStatus < 0 ? undefined : "Scan the QR code at the event location or visit the designated check-in point to confirm your attendance."}
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
              )
            }

            {/* Step 3: Checked In */}
            {
              activity.checkinStatus !== -1 && (
                <StepperItem
                  index={3}
                  icon={CheckCircle}
                  label={activity.checkinStatus === 3 ? "Activity Completed" : "Successfully Checked In"}
                  active={activity.checkinStatus === 2}
                  completed={activity.checkinStatus === 3}
                  error={activity.checkinStatus < 0}
                  disabled={activity.checkinStatus === 0}
                  description={
                    activity.checkinStatus < 0 ? undefined :
                      activity.checkinStatus === 3
                        ? "Congratulations! You've completed the activity. Please take a moment to share your feedback through the assessment."
                        : "Great! You're all set. Enjoy the activity and stay engaged throughout the session."
                  }
                />
              )
            }

            {/* Step 4: Assessment */}
            <StepperItem
              index={4}
              icon={FileText}
              label="Evaluation & Feedback"
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

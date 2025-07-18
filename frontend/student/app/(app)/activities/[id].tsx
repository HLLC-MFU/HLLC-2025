"use client"

import { router } from "expo-router"
import { useActivityStore } from "@/stores/activityStore"
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Image } from "expo-image"
import { Button, Separator, Input } from "tamagui"
import { ArrowLeft, Compass, Clock, QrCode, CheckCircle, FileText } from "@tamagui/lucide-icons"
import DateBadge from "./_components/date-badge"
import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import StepperItem from "@/components/activities/stepper-item"
import AssessmentModal from "./_components/AssessmentModal"
import { getStatusBadge } from "@/utils/activityStatus"
import { MapPin } from "lucide-react-native"
import { useLanguage } from "@/context/LanguageContext"


export default function ActivityDetailPage() {
  const activity = useActivityStore((s) => s.selectedActivity)
  const [selectedTab, setSelectedTab] = useState<"details" | "timeline">("details")
  const { t } = useTranslation()
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const { language } = useLanguage()
  if (!activity) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#999" }}>No activity data found.</Text>
      </View>
    )
  }
  const { label, color, icon: Icon } = getStatusBadge({
    checkinStatus: activity.checkinStatus,
    hasAnsweredAssessment: activity.hasAnsweredAssessment,
  })

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
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
            }}
          >
            {/* Top section: text info */}
            <View style={{ gap: 6, flex: 1, flexShrink: 1 }}>
              <Text style={{ fontSize: 13, color: "#888", textTransform: "uppercase" }}>{t("activity.activity")}</Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: "#222",
                  flexShrink: 1,
                }}
              >
                {activity.name[language] || activity.name.en}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Clock color="#666" size={16} />
                <Text style={{ fontSize: 15, color: "#666" }}>
                  {new Date(activity.metadata.startAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  {" - "}
                  {new Date(activity.metadata.endAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin color="#666" size={16} />
                <Text style={{ fontSize: 15, color: "#666" }}>{activity.location[language] || activity.location.en}</Text>
              </View>
              {/* Status Badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignSelf: "flex-start",
                  alignItems: "center",
                  backgroundColor: color,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  gap: 6,
                }}
              >
                <Icon color="white" size={14} />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{label}</Text>
              </View>
            </View>

            {/* Bottom section: DateBadge */}
            <View>
              <DateBadge date={activity.metadata.startAt} />
            </View>
          </View>

          <Separator />
          {/* Description */}
          <View>
            <Text style={{ fontSize: 16, lineHeight: 24, color: "#444", textAlign: "justify" }}>
              {activity.fullDetails[language] || activity.fullDetails.en}
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
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 72, marginBottom: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Timeline Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
              {t("activity.timeline.title")}
            </Text>
          </View>

          <View style={{ paddingBottom: 20 }}>
            {/* Step 1: Activity Start */}
            <StepperItem
              index={1}
              icon={Clock}
              label={
                activity.checkinStatus < 0
                  ? t("activity.missed")
                  :
                  activity.checkinStatus === 0
                    ? t("activity.notOpenYet")
                    : activity.checkinStatus > 0
                      ? t("activity.timeline.started")
                      : t("activity.ended")
              }
              active={activity.checkinStatus === 0}
              completed={activity.checkinStatus > 0}
              error={activity.checkinStatus < 0}
              disabled={activity.checkinStatus === 0}
              description={activity.checkinStatus < 0
                ? t("activity.timeline.missedDescription")
                : activity.checkinStatus <= 1
                  ? `${t("activity.timeline.activityBeginAt", {
                  startAt: new Date(activity.metadata.startAt).toLocaleString(language === "th" ? "th-TH" : "en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                }            
              )}` :  `${t("activity.timeline.activityBeganAt", {
                  startAt: new Date(activity.metadata.startAt).toLocaleString(language === "th" ? "th-TH" : "en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                }            
              )}`
              }
            >
            </StepperItem>



            {/* Step 2: Check-in */}
            {
              activity.checkinStatus !== -1 && (
                <StepperItem
                  index={2}
                  icon={QrCode}
                  label={activity.checkinStatus === 0 ? t("activity.timeline.notOpenforCheckin") : activity.checkinStatus === 1 ? t("activity.timeline.openCheckin") : t("activity.timeline.checkedIn")}
                  active={activity.checkinStatus === 1}
                  completed={activity.checkinStatus >= 2}
                  error={activity.checkinStatus < 0}
                  disabled={activity.checkinStatus === 0}
                  description={activity.checkinStatus === 1 ? "Scan the QR code at the event location or visit the designated check-in point to confirm your attendance." : undefined}
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
              activity.checkinStatus > 0 && (
                <StepperItem
                  index={3}
                  icon={CheckCircle}
                  label={activity.checkinStatus === 3 ? `${t("activity.timeline.activityEndedAt", {
                  endAt: new Date(activity.metadata.endAt).toLocaleString(language === "th" ? "th-TH" : "en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                }            
              )}` : "Successfully Checked In"}
                  active={activity.checkinStatus === 2}
                  completed={activity.checkinStatus === 3}
                  error={activity.checkinStatus < 0}
                  disabled={activity.checkinStatus === 0}
                  description={
                    activity.checkinStatus < 0 ? undefined :
                      activity.checkinStatus === 3 && !activity.hasAnsweredAssessment
                        ? "Congratulations! You've completed the activity. Please take a moment to share your feedback through the assessment."
                        : undefined
                  }
                />
              )
            }

            {/* Step 4: Assessment */}
            <StepperItem
              index={4}
              icon={FileText}
              label={activity.hasAnsweredAssessment ? t("activity.timeline.evaluated") : t("activity.timeline.evaluation")}
              active={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
              completed={activity.hasAnsweredAssessment}
              error={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
              disabled={activity.checkinStatus < 3}
              isLast
              description={!activity.hasAnsweredAssessment ? "Help us improve by sharing your experience and feedback about this activity." : undefined}
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
                    onPress={() => setShowAssessmentModal(true)}
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
      <AssessmentModal
        visible={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        activity={activity}
      />
    </View>
  )
}

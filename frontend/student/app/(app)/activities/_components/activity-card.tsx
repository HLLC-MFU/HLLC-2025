import { Card, Text, XStack, YStack } from "tamagui"
import { Image } from "expo-image"
import { TouchableOpacity, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import type { UserActivity } from "@/types/activities"
import { getStatusBadge } from "@/utils/activityStatus"
import { useLanguage } from "@/context/LanguageContext"

interface ActivityCardProps {
  activity: UserActivity
  onPress?: () => void
}

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  if (!activity) return null
  const { label, color, icon: Icon } = getStatusBadge({
    checkinStatus: activity.checkinStatus,
    hasAnsweredAssessment: activity.hasAnsweredAssessment,
  })
  const { language } = useLanguage()

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={{
        width: "100%",
        marginBottom: 20,
      }}
    >
      <Card
        borderRadius={32}
        overflow="hidden"
        backgroundColor="white"
        elevate
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
        }}
      >
        {/* Main Image */}
        <View style={{ position: "relative", height: 400 }}>
          <Image
            source={{
              uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`,
            }}
            contentFit="cover"
            style={{
              width: "100%",
              height: "100%",
            }}
          />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.8)"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <YStack style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: 24,
          }}>
            <YStack justifyContent="space-between" alignItems="flex-end" >
              <View
                style={{
                  flexDirection: "row",
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
            </YStack>
          </YStack>


          {/* Content Overlay */}
          <YStack
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 24,
            }}
          >

            <YStack justifyContent="space-between" alignItems="flex-start" marginBottom={12}>
              <Text
                fontSize="$8"
                fontWeight="700"
                color="white"
                numberOfLines={2}
                flex={1}
                marginRight={16}
                style={{
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {activity.name.en}
              </Text>
            </YStack>

            {/* Description */}
            <Text
              fontSize="$3"
              color="rgba(255,255,255,0.9)"
              numberOfLines={3}
              marginBottom={16}
              lineHeight={20}
              style={{
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {activity.location.en} • Experience an amazing adventure with stunning views and unforgettable memories.
            </Text>

            {/* Time Badges */}
            <XStack gap={12} marginBottom={20}>
              {activity.metadata?.startAt && (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text fontSize="$2" fontWeight="600" color="white">
                    {new Date(activity.metadata.startAt).toLocaleTimeString(language === "th" ? "th-TH" : "en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </XStack>
          </YStack>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { Animated, TouchableOpacity, View, Dimensions } from "react-native"
import { Text, XStack, YStack, Card } from "tamagui"
import { Image } from "expo-image"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import type { UserActivity } from "@/types/activities"
import { useLanguage } from "@/context/LanguageContext"
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react-native"

interface UpcomingActivityCardProps {
  activity: UserActivity
  onPress?: () => void
}

const { width: screenWidth } = Dimensions.get("window")

export default function UpcomingActivityCard({ activity, onPress }: UpcomingActivityCardProps) {
  const { language } = useLanguage()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  if (!activity) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language, {
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={{ marginVertical: 8 }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <Card
          borderRadius={28}
          overflow="hidden"
          backgroundColor="transparent"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.15)"
          elevate
        >
          <BlurView
            intensity={80}
            tint="light"
            style={{
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            {/* Hero Image Section */}
            <View style={{ position: "relative", height: 200 }}>
              <Image
                source={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`,
                }}
                contentFit="cover"
                style={{
                  width: "100%",
                  height: "100%",
                }}
                transition={300}
              />

              {/* Gradient Overlay */}
              <LinearGradient
                colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />

              {/* Top Info Badges */}
              <View
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  right: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* Date Badge */}
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Calendar size={16} color="#8B5CF6" />
                  <Text fontSize="$2" fontWeight="700" color="#8B5CF6">
                    {activity.metadata?.startAt && formatDate(activity.metadata.startAt)}
                  </Text>
                </View>

                {/* Time Badge */}
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Clock size={16} color="#8B5CF6" />
                  <Text fontSize="$2" fontWeight="700" color="#8B5CF6">
                    {activity.metadata?.startAt && formatTime(activity.metadata.startAt)}
                  </Text>
                </View>
              </View>

              {/* "Upcoming" Label */}
              <View
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  backgroundColor: "rgba(139, 92, 246, 0.9)",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text fontSize="$2" fontWeight="700" color="white">
                  UPCOMING
                </Text>
              </View>
            </View>

            {/* Content Section */}
            <YStack padding={20} gap={16}>
              {/* Logo and Title Section */}
              <XStack alignItems="center" gap={16}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Image
                    source={{
                      uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}`,
                    }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                    }}
                    contentFit="cover"
                  />
                </View>

                <YStack flex={1} gap={6}>
                  <Text fontSize="$7" fontWeight="800" color="rgba(0,0,0,0.9)" numberOfLines={2} lineHeight={28}>
                    {activity.name[language] || activity.name.en}
                  </Text>

                  <XStack alignItems="center" gap={8}>
                    <MapPin size={16} color="rgba(0,0,0,0.6)" />
                    <Text fontSize="$3" color="rgba(0,0,0,0.7)" numberOfLines={1} flex={1} fontWeight="500">
                      {activity.location[language] || activity.location.en}
                    </Text>
                  </XStack>
                </YStack>

                <ArrowRight size={24} color="rgba(0,0,0,0.4)" />
              </XStack>

              {/* Description */}
              {(activity.shortDetails[language] || activity.shortDetails.en) && (
                <Card
                  backgroundColor="rgba(139, 92, 246, 0.05)"
                  borderRadius={16}
                  padding={16}
                  borderWidth={1}
                  borderColor="rgba(139, 92, 246, 0.1)"
                >
                  <Text fontSize="$3" color="rgba(0,0,0,0.8)" numberOfLines={3} lineHeight={20}>
                    {activity.shortDetails[language] || activity.shortDetails.en}
                  </Text>
                </Card>
              )}

              {/* Action Hint */}
              <XStack alignItems="center" justifyContent="center" gap={8} paddingVertical={8}>
                <View
                  style={{
                    width: 32,
                    height: 2,
                    backgroundColor: "rgba(139, 92, 246, 0.3)",
                    borderRadius: 1,
                  }}
                />
                <Text fontSize="$2" color="rgba(0,0,0,0.5)" fontWeight="600">
                  TAP TO VIEW DETAILS
                </Text>
                <View
                  style={{
                    width: 32,
                    height: 2,
                    backgroundColor: "rgba(139, 92, 246, 0.3)",
                    borderRadius: 1,
                  }}
                />
              </XStack>
            </YStack>
          </BlurView>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  )
}

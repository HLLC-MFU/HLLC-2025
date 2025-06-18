import { Card, Text, XStack, YStack } from "tamagui";
import { Image } from "expo-image";
import { Calendar, Clock, MapPin } from "@tamagui/lucide-icons";
import { TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { UserActivity } from "@/types/activities";
import { SharedElement } from "react-navigation-shared-element";

interface ActivityCardProps {
  activity: UserActivity;
  onPress?: () => void;
}

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  if (!activity) return null;

  const imageId = `activity-image-${activity._id}`;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        width: "100%",
        marginBottom: 20,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <BlurView
        intensity={40}
        tint="light"
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <YStack>
          <SharedElement id={imageId}>
            <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
              <Image
                source={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.banner}`,
                }}
                contentFit="cover"
                style={{
                  width: "100%",
                  height: 120,
                }}
              />

              {/* Bottom gradient overlay */}
              <View
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                }}
              />

              {/* Overlay text content */}
              <View
                style={{
                  flexDirection: "row",
                  position: "absolute",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  height: "100%",
                  padding: 16,
                }}
              >
                <Image
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.thumbnail}`,
                  }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                  contentFit="cover"
                />
                <YStack>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  color="#fff"
                  numberOfLines={1}
                  style={{
                    textShadowColor: 'rgba(0,0,0,0.6)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  {activity.name.en}
                </Text>

                <XStack alignItems="center" gap={6} marginTop={4}>
                  <MapPin size={14} color="white" />
                  <Text
                    fontSize="$2"
                    color="#fff"
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      textShadowColor: 'rgba(0,0,0,0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {activity.location.en}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap={16} marginTop={4}>
                  <XStack alignItems="center" gap={4}>
                    <Clock size={14} color="#fff" />
                    <Text fontSize="$2" color="#fff">
                      {activity.metadata?.startAt
                        ? new Date(activity.metadata.startAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "N/A"}
                    </Text>
                  </XStack>

                  <XStack alignItems="center" gap={4}>
                    <Calendar size={14} color="#fff" />
                    <Text fontSize="$2" color="#fff">
                      {activity.metadata?.startAt
                        ? new Date(activity.metadata.startAt).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </XStack>
                </XStack>
                </YStack>

              </View>
            </View>
          </SharedElement>
        </YStack>
      </BlurView>
    </TouchableOpacity>
  );
}

import { Card, Text, XStack, YStack } from "tamagui"
import { Image } from "expo-image"
import { Calendar, Clock, MapPin } from "@tamagui/lucide-icons"
import { TouchableOpacity } from "react-native"
import { UserActivity } from "@/types/activities"

interface ActivityCardProps {
  activity: UserActivity
  onPress?: () => void
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
    if (!activity) return null; 
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: "48%", marginBottom: 16 }}>
      <Card unstyled overflow="hidden" borderRadius="$4" backgroundColor="white" elevation="$1">
        <YStack>
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.banner}` }}
            contentFit="cover"
            style={{
              width: "100%",
              height: 140,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
            transition={200}
          />

          <YStack padding="$3" gap="$2">
            <Text fontSize="$3" fontWeight="bold" numberOfLines={1}>
              {activity.name.en} 
            </Text>

            <XStack alignItems="center" gap="$1">
              <MapPin size={14} />
              <Text fontSize="$1"  numberOfLines={1} flex={1}>
                {activity.location.en}
              </Text>
            </XStack>

            <XStack gap="$3">
              <XStack alignItems="center" gap="$1">
                <Clock size={14}  />
                <Text fontSize="$1">
                  {activity.metadata?.startAt
                    ? new Date(activity.metadata.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : "N/A"}
                </Text>
              </XStack>

              <XStack alignItems="center" gap="$1">
                <Calendar size={14} />
                <Text fontSize="$1" >
                  {activity.metadata?.startAt
                    ? new Date(activity.metadata.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : "N/A"}
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </YStack>
      </Card>
    </TouchableOpacity>
  )
}

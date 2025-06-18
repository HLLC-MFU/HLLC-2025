import { Card, Text, XStack, YStack } from "tamagui"
import { Image } from "expo-image"
import { ArrowUpRight, Clock, MapPin, Users } from "@tamagui/lucide-icons"
import { BlurView } from "expo-blur"
import { TouchableOpacity } from "react-native"
import { UserActivity } from "@/types/activities"

interface UpcomingActivityCardProps {
  activity: UserActivity
  onPress?: () => void
}

export default function UpcomingActivityCard({ activity, onPress }: UpcomingActivityCardProps) {
  if (!activity) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card unstyled height={220} overflow="hidden" borderRadius="$6" marginVertical="$1">
        <Card.Header padding="$3">
          <XStack justifyContent="space-between" alignItems="center" width="100%">
            <BlurView
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 24,
                overflow: "hidden",
              }}
              intensity={30}
              tint="dark"
            >
              <Clock color="white" size={16} />
              <Text fontSize="$2" fontWeight="bold" color="white">
                                  {activity.metadata?.startAt
                    ? new Date(activity.metadata.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : "N/A"}
              </Text>
            </BlurView>

            <BlurView
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 24,
                overflow: "hidden",
              }}
              intensity={30}
              tint="dark"
            >
              <MapPin color="white" size={16} />
              <Text fontSize="$2" fontWeight="bold" color="white">
                {activity.location.en}
              </Text>
            </BlurView>
          </XStack>
        </Card.Header>

        <Card.Footer padded justifyContent="flex-end">
          <BlurView
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
            intensity={30}
            tint="dark"
          >
            <ArrowUpRight color="white" size={20} />
          </BlurView>
        </Card.Footer>

        <Card.Background>
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.banner}` }}
            contentFit="cover"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
            transition={200}
          />
          <YStack
            position="absolute"
            bottom={0}
            width="100%"
            height="70%"
        
            opacity={0.7}
            style={{
              backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            }}
          />
        </Card.Background>
      </Card>
    </TouchableOpacity>
  )
}

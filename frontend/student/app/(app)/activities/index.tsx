import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { ScrollView, SafeAreaView } from "react-native"
import { Search } from "lucide-react-native"
import {
  H2,
  H4,
  Input,
  Paragraph,
  Separator,
  Spinner,
  XStack,
  YStack,
  Card,
} from "tamagui"

import { apiRequest } from "@/utils/api"
import { UpcomingActivityCard } from "./_components/upcoming-activity-card"
import { ActivityCard } from "./_components/activity-card"
import { useActivityStore } from "@/stores/activityStore"
import { UserActivity } from "@/types/activities"
import { BlurView } from "expo-blur"
import FadeView from "@/components/ui/FadeView"

export default function ActivitiesPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await apiRequest("/activities/users", "GET") as { data?: { data?: UserActivity[] } }
      const apiData = response.data?.data || []
      setActivities(apiData)
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    const name = activity.name?.en ?? ""
    const location = activity.location?.en ?? ""
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const now = Date.now()
  const upcomingActivity = activities
    .filter((a) => {
      const endAt = new Date(a.metadata?.endAt).getTime()
      return !isNaN(endAt) && endAt > now
    })
    .sort((a, b) =>
      new Date(a.metadata.startAt).getTime() -
      new Date(b.metadata.startAt).getTime()
    )[0] ?? null



  return (
    <FadeView>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4" flex={1}>
          <H2 fontWeight="bold" color={"white"}>Activities</H2>

          <XStack
            alignItems="center"
            paddingHorizontal="$3"
            borderRadius="$6"
            height="$5"
            borderWidth={2}
            borderColor={"#ffffff20"}
          >
            <Search size={18} color={"#ffffff80"} />
            <Input
              flex={1}
              size="$4"
              borderWidth={0}
              placeholder="Search activities..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ backgroundColor: "transparent" }}
            />
          </XStack>

          {loading ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" />
              <Paragraph marginTop="$2">Loading activities...</Paragraph>
            </YStack>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {upcomingActivity && (
                <>
                  <YStack gap="$3" marginBottom="$5">
                    <H4 fontWeight="bold" color={"white"}>Upcoming Activity</H4>
                    <UpcomingActivityCard
                      activity={upcomingActivity}
                      onPress={() => {
                        useActivityStore
                          .getState()
                          .setSelectedActivity(upcomingActivity)
                        router.push(`/activities/${upcomingActivity._id}`)
                      }}
                    />
                  </YStack>
                  <Separator marginVertical="$2" />
                </>
              )}

              <YStack gap="$3" marginBottom="$10">
                <H4 fontWeight="bold" color={"white"}>All Activities</H4>
                <XStack flexWrap="wrap" justifyContent="space-between">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity._id}
                        activity={activity}
                        onPress={() => {
                          useActivityStore
                            .getState()
                            .setSelectedActivity(activity)
                          router.push(`/activities/${activity._id}`)
                        }}
                      />
                    ))
                  ) : (
                    <BlurView style={{ width: "100%", padding: 20, borderRadius: 10 }} intensity={0} tint="dark">
                      <Paragraph textAlign="center" color="#ffffff80">
                        No activities found
                      </Paragraph>
                    </BlurView>
                  )}
                </XStack>
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </SafeAreaView>
    </FadeView>
  )
}

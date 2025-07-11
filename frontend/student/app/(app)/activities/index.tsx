import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { ScrollView, SafeAreaView, RefreshControl } from "react-native"  // <-- added RefreshControl
import { Search } from "lucide-react-native"
import {
  Text,
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
import { useActivityStore } from "@/stores/activityStore"
import { UserActivity } from "@/types/activities"
import { BlurView } from "expo-blur"
import FadeView from "@/components/ui/FadeView"
import UpcomingActivityCard from "./_components/upcoming-activity-card"
import ActivityCard from "./_components/activity-card"
import { useTranslation } from "react-i18next"

export default function ActivitiesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) // <-- new refreshing state
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    if (!refreshing) setLoading(true)  // only show loading spinner on first load, not on refresh
    try {
      const response = await apiRequest("/activities/user", "GET") as { data?: UserActivity[] }
      const apiData = response.data || []
      setActivities(apiData)
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)  // stop refresh control spinner
    }
  }

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true)
    fetchActivities()
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
          <Text fontWeight="bold" fontSize={34} color={"white"}>
            {t("activity.title")}
          </Text>

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

          {loading && !refreshing ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" />
              <Paragraph marginTop="$2">Loading activities...</Paragraph>
            </YStack>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {upcomingActivity && (
                <>
                  <YStack gap="$3" marginBottom="$5">
                    <H4 fontWeight="bold" color={"white"}>
                      Upcoming Activity
                    </H4>
                    <UpcomingActivityCard
                      activity={upcomingActivity}
                      onPress={() => {
                        useActivityStore.getState().setSelectedActivity(upcomingActivity)
                        router.push(`/activities/${upcomingActivity._id}`)
                      }}
                    />
                  </YStack>
                  <Separator marginVertical="$2" />
                </>
              )}

              <YStack gap="$3" marginBottom="$10">
                <Text fontWeight="bold" color={"white"} fontSize={28}>
                  {t("activity.allActivities")}
                </Text>
                <XStack flexWrap="wrap" justifyContent="space-between">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity._id}
                        activity={activity}
                        onPress={() => {
                          useActivityStore.getState().setSelectedActivity(activity)
                          router.push(`/activities/${activity._id}`)
                        }}
                      />
                    ))
                  ) : (
                    <BlurView
                      style={{ width: "100%", padding: 20, borderRadius: 10 }}
                      intensity={0}
                      tint="dark"
                    >
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

import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { ScrollView, SafeAreaView, RefreshControl } from "react-native"  // <-- added RefreshControl
import {
  Text,
  H4,
  Paragraph,
  Separator,
  Spinner,
  XStack,
  YStack,
} from "tamagui" 

import { apiRequest } from "@/utils/api"
import { useActivityStore } from "@/stores/activityStore"
import { UserActivity } from "@/types/activities"
import { BlurView } from "expo-blur"
import FadeView from "@/components/ui/FadeView"
import UpcomingActivityCard from "./_components/upcoming-activity-card"
import ActivityCard from "./_components/activity-card"
import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/global/SearchInput"

export default function ActivitiesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    if (!refreshing) setLoading(true)
    try {
      interface ApiResponse {
        data: {
          data?: UserActivity[]
        } | null
      }

      const response: ApiResponse = await apiRequest("/activities/user", "GET")
      console.log("Fetched activities response:", response)
      const apiData = response.data && Array.isArray(response.data.data) ? response.data.data : []
      setActivities(apiData)
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
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

          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('activity.searchPlaceholder')}
          />

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
                      {t("activity.upcoming")}
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

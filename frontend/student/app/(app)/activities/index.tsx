import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import {
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native"
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
import ActivityCard from "./_components/activity-card"
import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/global/SearchInput"
import { useProgress } from "@/hooks/useProgress"

// Create a global function to refresh activities
let refreshActivitiesGlobal: (() => Promise<void>) | null = null

export const setRefreshActivitiesGlobal = (fn: () => Promise<void>) => {
  refreshActivitiesGlobal = fn
}

export const getRefreshActivitiesGlobal = () => refreshActivitiesGlobal

export default function ActivitiesPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { fetchProgress } = useProgress()

  // Fetch activities on mount and refresh
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
      const apiData = response.data && Array.isArray(response.data.data) ? response.data.data : []
      setActivities(apiData)
      
      // Update selected activity in store if it exists
      const selectedActivity = useActivityStore.getState().selectedActivity
      if (selectedActivity) {
        const updatedActivity = apiData.find(a => a._id === selectedActivity._id)
        if (updatedActivity) {
          useActivityStore.getState().setSelectedActivity(updatedActivity)
        }
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Set global refresh function
  useEffect(() => {
    setRefreshActivitiesGlobal(fetchActivities)
  }, [])

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true)
    fetchActivities()
    fetchProgress() // Refresh progress data as well
  }

  // Filter activities by search query
  const filteredActivities = activities
    .filter((activity) => {
      const name = activity.name?.en ?? ""
      const location = activity.location?.en ?? ""
      const query = searchQuery.toLowerCase()
      return (
        name.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const aStart = new Date(a.metadata?.startAt).getTime()
      const bStart = new Date(b.metadata?.startAt).getTime()
      return aStart - bStart
    })

  // Find the nearest upcoming activity (end date in the future)
  const now = Date.now()
  const upcomingActivity =
    activities
      .filter((a) => {
        const endAt = new Date(a.metadata?.endAt).getTime()
        return !isNaN(endAt) && endAt > now
      })
      .sort(
        (a, b) =>
          new Date(a.metadata.startAt).getTime() - new Date(b.metadata.startAt).getTime()
      )[0] ?? null

  // Navigate to activity details and store selected activity
  const handleActivityPress = (activity: UserActivity) => {
    useActivityStore.getState().setSelectedActivity(activity)
    router.push(`/activities/${activity._id}`)
  }

  return (
    <FadeView>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4" flex={1}>
          {/* Page Title */}
          <Text fontWeight="bold" fontSize={34} color="white">
            {t("activity.title")}
          </Text>

          {/* Search Bar */}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("activity.searchPlaceholder")}
          />

          {/* Loading Spinner */}
          {loading && !refreshing ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" />
              <Paragraph marginTop="$2">Loading activities...</Paragraph>
            </YStack>
          ) : (
            // Activities List with Pull-to-Refresh
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {/* Upcoming Activity Section */}
              {upcomingActivity && (
                <>
                  <YStack gap="$3" marginBottom="$5">
                    <H4 fontWeight="bold" color="white">
                      {t("activity.upcoming")}
                    </H4>
                    <ActivityCard
                      activity={upcomingActivity}
                      onPress={() => handleActivityPress(upcomingActivity)}
                    />
                  </YStack>
                  <Separator marginVertical="$2" />
                </>
              )}

              {/* All Activities Section */}
              <YStack gap="$3" marginBottom="$10">
                <Text fontWeight="bold" fontSize={28} color="white">
                  {t("activity.allActivities")}
                </Text>
                <XStack flexWrap="wrap" justifyContent="space-between">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity._id}
                        activity={activity}
                        onPress={() => handleActivityPress(activity)}
                      />
                    ))
                  ) : (
                    <BlurView
                      style={{ width: "100%", padding: 20, borderRadius: 10 }}
                      intensity={0}
                      tint="dark"
                    >
                      <Paragraph textAlign="center" color="#ffffff80">
                        {t("activity.noActivitiesFound") || "No activities found"}
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

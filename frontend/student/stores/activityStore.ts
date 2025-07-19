// stores/activityStore.ts
import { UserActivity } from '@/types/activities'
import { create } from 'zustand'
import { apiRequest } from '@/utils/api'

type ActivityStore = {
  selectedActivity: UserActivity | null
  isLoading: boolean
  error: string | null
  setSelectedActivity: (activity: UserActivity) => void
  clearSelectedActivity: () => void
  refreshSelectedActivity: () => Promise<void>
  clearError: () => void
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  selectedActivity: null,
  isLoading: false,
  error: null,
  setSelectedActivity: (activity) => set({ selectedActivity: activity, error: null }),
  clearSelectedActivity: () => set({ selectedActivity: null, error: null }),
  clearError: () => set({ error: null }),
  refreshSelectedActivity: async () => {
    const currentActivity = get().selectedActivity
    if (!currentActivity?._id) {
      set({ error: 'No activity selected for refresh' })
      return
    }

    // Prevent multiple simultaneous requests
    if (get().isLoading) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      const response = await apiRequest(`/activities/user/${currentActivity._id}`, "GET")
      
      // Validate response structure
      if (!response?.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format')
      }

      // Validate required fields (adjust based on UserActivity type)
      const updatedActivity = response.data as UserActivity
      if (!updatedActivity._id || !updatedActivity.name) {
        throw new Error('Invalid activity data received')
      }

      set({ selectedActivity: updatedActivity, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh activity'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      console.error("Failed to refresh activity:", error)
    }
  },
}))

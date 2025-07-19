// stores/activityStore.ts
import { UserActivity } from '@/types/activities'
import { create } from 'zustand'

type ActivityStore = {
  selectedActivity: UserActivity | null
  setSelectedActivity: (activity: UserActivity) => void
  clearSelectedActivity: () => void
}

export const useActivityStore = create<ActivityStore>((set) => ({
  selectedActivity: null,
  setSelectedActivity: (activity) => set({ selectedActivity: activity }),
  clearSelectedActivity: () => set({ selectedActivity: null }),
}))
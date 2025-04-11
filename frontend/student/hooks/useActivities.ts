import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Activity } from "@/types/activities";
import { apiRequest } from "@/utils/api";
import i18n from "@/context/i18n";
import useProfile from "./useProfile";

// 💡 Helper: compare activities
function isEqualActivities(a1: Activity[], a2: Activity[]): boolean {
  if (a1.length !== a2.length) return false;
  return JSON.stringify(a1) === JSON.stringify(a2);
}

// 💾 Zustand Store
type ActivityStore = {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  lastFetchedAt: number | null;
  selectedActivity: Activity | null;
  setSelectedActivity: (activity: Activity | null) => void;
  fetchActivities: (userId: string, forceReload?: boolean) => Promise<void>;
};

const useActivitiesStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      loading: false,
      error: null,
      hasFetched: false,
      lastFetchedAt: null,
      selectedActivity: null,

      setSelectedActivity: (activity) => {
        set({ selectedActivity: activity });
      },

      fetchActivities: async (userId, forceReload = false) => {
        const state = get();
        if (state.loading) return;
        if (state.hasFetched && !forceReload) {
          console.log("⏭️ Skipped fetchActivities: already fetched");
          return;
        }

        console.log("🚀 Fetching activities for user", userId);
        set({ loading: true, error: null });

        try {
          const res = await apiRequest<Activity[]>(`/users/${userId}/activities`);
          if (res.statusCode !== 200 || !res.data) {
            throw new Error(res.message || "Failed to fetch activities");
          }

          const oldActivities = state.activities;
          if (isEqualActivities(res.data, oldActivities)) {
            console.log("🟡 No changes in activities. Skip updating state.");
            set({ loading: false, hasFetched: true, lastFetchedAt: Date.now() });
            return;
          }

          set({
            activities: res.data,
            loading: false,
            hasFetched: true,
            lastFetchedAt: Date.now(),
          });

          console.log("✅ Activities updated:", res.data.length);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unexpected error";
          console.error("❌ Error in fetchActivities:", message);
          set({ error: message, loading: false, hasFetched: true });
        }
      },
    }),
    {
      name: "activity-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activities: state.activities,
        hasFetched: state.hasFetched,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);

// ✅ Custom Hook รวม logic กับ Zustand store
export function useActivities() {
  const { user } = useProfile();
  const {
    activities,
    loading,
    error,
    hasFetched,
    fetchActivities,
  } = useActivitiesStore();

  useEffect(() => {
    if (user?.id) fetchActivities(user.id);
  }, [user?.id]);

  return {
    activities,
    loading,
    error,
    lang: i18n.language as "th" | "en",
  };
}

// Optional: export store access
export default useActivitiesStore;

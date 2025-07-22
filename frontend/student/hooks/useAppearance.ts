import { Appearance } from "@/types/appearance";
import { apiRequest } from "@/utils/api";
import { create } from "zustand";

interface AppearanceState {
  appearance: Appearance | null;
  assets: Record<string, string>;
  colors: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetchAppearance: (schoolId: string) => Promise<void>;
}

export const useAppearance = create<AppearanceState>((set) => ({
  appearance: null,
  assets: {},
  colors: {},
  loading: false,
  error: null,
  fetchAppearance: async (schoolId: string) => {
    if (!schoolId) {
      console.warn("No schoolId found — skipping appearance fetch.");
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await apiRequest<Appearance>(`/schools/${schoolId}/appearances`, "GET");
      if (res.statusCode !== 200 || !res.data || !res.data.data?.length) {
        throw new Error(res.message || "Failed to fetch appearance");
      }
      const firstAppearance = res.data.data[0];
      set({
        appearance: res.data,
        assets: firstAppearance.assets ?? {},
        colors: firstAppearance.colors ?? {},
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      set({ error: message, loading: false });
    }
  },
}));

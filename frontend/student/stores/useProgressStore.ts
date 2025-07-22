import { create } from 'zustand';

interface ProgressResponse {
  userProgressCount: number;
  progressPercentage: number;
  scopedActivitiesCount: number;
}

interface ProgressStore {
  progress: ProgressResponse | null;
  setProgress: (data: ProgressResponse | null) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  progress: null,
  setProgress: (data) => set({ progress: data }),
}));

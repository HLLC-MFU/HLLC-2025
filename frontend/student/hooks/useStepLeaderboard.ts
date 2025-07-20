import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

// Type definitions
export type StepEntry = {
  totalStep: number;
  step: number;
  date: string;
};

export type Ranking = {
  user: {
    id: string;
    name: {
      first: string;
      middle?: string;
      last?: string;
    };
    username: string;
    avatar?: string;
  };
  totalStep: number;
};

export type MyRank = {
    steps: StepEntry[];
    totalStep: number;
    individualRank?: number;
    schoolRank?: number;
    archeivementRank?: number;
    avatar?: string;
}

export type LeaderboardData = {
  individualRank: Ranking[];
  schoolRank?: Ranking[];
  archeivementRank: (Ranking & { rank: number; completeStatus: boolean })[];
  myRank: MyRank
};

export type AchievementData = {
  id: string;
  archievement: number; // typo preserved if it's from the backend
};

export const useStepData = () => {
  const [stepData, setStepData] = useState<LeaderboardData | null>(null);
  const [achievementData, setAchievementData] = useState<AchievementData[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch both leaderboard and achievements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaderboard = await apiRequest< LeaderboardData >('/step-counters/leaderboard/user');
        const achievements = await apiRequest<{ data: AchievementData[] }>('/step-achievement');
        setStepData(leaderboard.data ?? null);
        setAchievementData(achievements.data?.data ?? null);
      } catch (error) {
        console.error("Error fetching step data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { stepData, achievementData, loading };
};

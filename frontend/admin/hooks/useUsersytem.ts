import { useEffect, useState } from "react";

import { apiRequest } from "@/utils/api";
import {UseruseSystem} from '@/types/user-stats'

export const useUserStatistics = () => {
  const [Userstats, setUserStats] = useState<UseruseSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await apiRequest<UseruseSystem>("/users/statistics");

        if (response.data == null) {
          throw new Error("No statistics data received");
        }
        const Userstats: UseruseSystem = response.data;
          setUserStats(Userstats);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { Userstats, loading, error };
};

import useProfile from "./useProfile";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";


export const getStepData = async (): Promise<any> => {
  try {
    const { user } = useProfile.getState();
    if (!user || !user.data || user.data.length === 0 || !user.data[0]._id) {
      return { users: [], myRank: null };
    }

    const res = await apiRequest<{data: IndividualStepCounterResponse, myRank?: {data: StepResponse}}>('/step-counters/leaderboard/me', 'GET');
    const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
    const sorted = rawData.sort((a, b) => b.totalStep - a.totalStep);

    const ranked = sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
      user: {
        ...item.user,
      },
    }));

    // match myRank with the ranked version
    const rawMyRank = res.data?.myRank;
    const myDataIndex = ranked.findIndex(r => r._id === rawMyRank?.data?._id);

    const myRank = rawMyRank && myDataIndex !== -1
      ? {
        rank: ranked[myDataIndex].rank,
        data: ranked[myDataIndex],
      }
      : null;
    return {
      users: ranked,
      myRank,
    };
  } catch (e) {
    console.error('Failed to fetch leaderboard', e);
    return { users: [], myRank: null };
  }
};
export const useStepCounter = () => {
  const [individualStepCounter, setindividualStepCounter] = useState<IndividualStepCounterResponse>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getStepData();
      setindividualStepCounter(result);
      setLoading(false);
    };
    load();
  }, []);

  return {
    individualStepCounter,
    loading,
  };
};
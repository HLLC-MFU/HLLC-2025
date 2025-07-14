import { Leaderboard } from "@/types/leaderboard";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useState } from "react";

export function useLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Leaderboard[] }>(
                "/coin-collections/leaderboard", 
                "GET"
            );

            setLeaderboard(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch leaderboard. Please try again.',
                color: 'danger'
            })
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch leaderboard.'
                    : 'Failed to fetch leaderboard.'
            )
        } finally {
            setLoading(false);
        }
    }

    return {
        leaderboard,
        loading,
        error,
        fetchLeaderboard
    }
}
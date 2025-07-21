import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { Leaderboard } from "@/types/coin-hunting";

export function useCoinHunting() {
    const [coinHunting, setCoinHunting] = useState<Leaderboard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCoinHuntingLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{
                message: string;
                data: Leaderboard[];
            }>("/coin-collections/leaderboard", "GET");

            if (res && res.data && Array.isArray(res.data.data)) {
                setCoinHunting(res.data.data);
            } else {
                setCoinHunting([]);
            }
        } catch (err) {
            setError("Failed to fetch coin-hunting.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoinHuntingLeaderboard();
    }, []);

    return {
        coinHunting,
        loading,
        error,
        fetchCoinHuntingLeaderboard,
    };
}

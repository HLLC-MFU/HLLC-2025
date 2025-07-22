import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { Leaderboard, Sponsorboard } from "@/types/coin-hunting";

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
        refetch: fetchCoinHuntingLeaderboard
    };
}

export function useSponsorCoinHunting(landmarkId?: string) {
    const [sponsorCoinHunting, setSponsorCoinHunting] = useState<Sponsorboard[]>([]);
    const [sponsorLoading, setSponsorLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCoinHuntingSponsorboard = async (landmarkId: string) => {
        setSponsorLoading(true);
        setError(null)
        try {
            const res = await apiRequest<{ data: Sponsorboard[] }>(
                `/coin-collections/sponsor-reward?landmarkId=${landmarkId}`
            );
            if (res && res.data && Array.isArray(res.data)) {
                setSponsorCoinHunting(res.data);
            } else {
                setSponsorCoinHunting([]);
            }
            console.log("เป็นควยไร", res);

        } catch (error) {
            setError("Failed to fetch coin-hunting sponsor.");
        } finally {
            setSponsorLoading(false);
        }
    };

    useEffect(() => {
        if (landmarkId) {
            fetchCoinHuntingSponsorboard(landmarkId);
        }
    }, [landmarkId]);

    return {
        sponsorCoinHunting,
        sponsorLoading,
        error,
        fetchCoinHuntingSponsorboard,
        refetch: () => landmarkId && fetchCoinHuntingSponsorboard(landmarkId),
    };
}
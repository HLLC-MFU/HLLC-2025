import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { PretestAnswer, PretestAverage } from "@/types/pretestAnswer";

export function usePretest({ page = 1, limit = 5 } = {}) {
    const [pretestAnswer, setPretestAnswer] = useState<PretestAnswer[]>([]);
    const [pretestAverage, setPretestAverage] = useState<PretestAverage[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalAverageCount, setTotalAverageCount] = useState(0);
    const [totalAnswerCount, setTotalAnswerCount] = useState(0);
    const [error, setError] = useState<string | null>(null);


    const fetchPretestAnswer = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PretestAnswer[], total: number }>(
                `/pretest-answers?page=${page}&limit=${limit}`,
                "GET");
            setPretestAnswer(Array.isArray(res.data?.data) ? res.data.data : []);
            setTotalAnswerCount(res.data?.total || 0);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch pretest answer.'
                    : 'Failed to fetch pretest answer.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchPretestAverage = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PretestAverage[], total: number }>(
                `/pretest-answers/all/average?page=${page}&limit=${limit}`,
                'GET'
            );

            setPretestAverage(res.data?.data || []);
            setTotalAverageCount(res.data?.total || 0);
        } catch (err) {
            setError('Failed to fetch pretests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPretestAnswer();
        fetchPretestAverage();
    }, [page, limit]);

    return {
        pretestAverage,
        pretestAnswer,
        totalAverageCount,
        totalAnswerCount,
        loading,
        error,
    };
}
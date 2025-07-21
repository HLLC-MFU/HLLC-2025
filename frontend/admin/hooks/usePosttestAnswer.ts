import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { PottestAnswer, PotestAverage } from "@/types/posttestAnswer";

export function usePosttest({ page = 1, limit = 5 } = {}) {
    const [posttestAnswer, setPosttestAnswer] = useState<PottestAnswer[]>([]);
    const [posttestAverage, setPosttestAverage] = useState<PotestAverage[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalAverageCount, setTotalAverageCount] = useState(0);
    const [totalAnswerCount, setTotalAnswerCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const fetchPosttestAnswer = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PottestAnswer[], total: number }>(
                `/posttest-answers?page=${page}&limit=${limit}`,
                "GET");
            setPosttestAnswer(Array.isArray(res.data?.data) ? res.data.data : []);
            setTotalAnswerCount(res.data?.total || 0);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch posttest answer.'
                    : 'Failed to fetch posttest answer.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchPosttestAverage = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PotestAverage[], total: number }>(
                `/posttest-answers/all/average?page=${page}&limit=${limit}`,
                'GET'
            );
            // Support both array and object response
            if (Array.isArray(res.data)) {
                setPosttestAverage(res.data);
                setTotalAverageCount(res.data.length);
            } else if (res.data?.data) {
                setPosttestAverage(res.data.data);
                setTotalAverageCount(res.data.total || 0);
            } else {
                setPosttestAverage([]);
                setTotalAverageCount(0);
            }
        } catch (err) {
            setError('Failed to fetch posttests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosttestAnswer();
        fetchPosttestAverage();
    }, [page, limit]);

    return {
        posttestAverage,
        posttestAnswer,
        totalAverageCount,
        totalAnswerCount,
        loading,
        error,
    };
} 
import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { PretestAnswer, PretestAverage } from "@/types/pretestAnswer";

export function usePretest() {
    const [pretestAnswer, setPretestAnswer] = useState<PretestAnswer[]>([]);
    const [pretestAverage, setPretestAverage] = useState<PretestAverage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const fetchPretestAnswer = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PretestAnswer[] }>("/pretest-answers", "GET");
            console.log('kuy', res);

            setPretestAnswer(Array.isArray(res.data?.data) ? res.data.data : []);
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

    // Fetch pretest average.
    const fetchPretestAverage = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PretestAverage[] }>("/pretest-answers/all/average?limit=0", "GET");
            console.log('ไอหน้าหี', res);

            setPretestAverage(Array.isArray(res.data) ? res.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch pretests.'
                    : 'Failed to fetch pretests.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPretestAverage();
        fetchPretestAnswer();
    }, []);

    return {
        pretestAverage,
        pretestAnswer,
        loading,
        error,
    }
}
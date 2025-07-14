import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { ProgressBarActivities } from '@/types/progress';

export function useProgress() {
    const [progress, setProgress] = useState<ProgressBarActivities | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProgressByUser = async () => {
        setProgressLoading(true);
        setError(null);
        try {
            const res = await apiRequest<any>('/activities/progress', 'GET');

            console.log('API raw response:', res);

            if (res && 'data' in res) {
                setProgress(res.data ?? null);
            } else {
                setProgress(res ?? null);
            }
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch progress by user.'
                    : 'Failed to fetch progress by user.'
            );
        } finally {
            setProgressLoading(false);
        }
    };

    useEffect(() => {
        fetchProgressByUser();
    }, []);

    useEffect(() => {
        console.log('progress updated', progress);
    }, [progress]);

    return {
        progress,
        progressLoading,
        error,
        fetchProgressByUser,
    };
}

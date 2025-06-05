import { useState, useEffect } from 'react';
import { Major } from '@/types/school';
import { apiRequest } from "@/utils/api"

export function useMajors() {
    const [majors, setMajors] = useState<Major[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all majors
    const fetchMajors = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Major[] }>('/majors?limit=0', 'GET');
            setMajors(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch majors.'
                : 'Failed to fetch majors.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMajors()
    }, []);

    return { majors, loading, error, fetchMajors };
}
import { apiRequest } from '@/utils/api';
import { Activities } from '@/types/activities';
import { useState, useEffect } from 'react';


export function useActivities() {
    const [activities, setActivities] = useState<Activities[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchActivitiesByUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Activities[] }>('/activities/users', 'GET');
            setActivities(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch activities by user.'
                : 'Failed to fetch activities by user.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivitiesByUser();
    }, []);

    return { activities, loading, error, fetchActivitiesByUser };
}
import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import { System } from '@/types/system';

export function useSystem() {
    const [systems, setSystems] = useState<System[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSystems = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: System[] }>(
                '/system-status?limit=0',
                'GET',
            );

            setSystems(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch system status. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch System status.'
                    : 'Failed to fetch System status.',
            );
        } finally {
            setLoading(false);
        }
    };

    const createSystem = async (systemData: Partial<System>): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest<System>('/system-status', 'POST', systemData);

            if (res.data) {
                setSystems((prev) => [...prev, res.data as System]);
                addToast({
                    title: 'System status created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create System status.');
        } finally {
            setLoading(false);
        }
    };

    const updateSystem = async (
        id: string,
        systemData: Partial<System>,
    ): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest<System>(
                `/system-status/${id}`,
                'PATCH',
                systemData,
            );

            if (res.data) {
                setSystems((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
                addToast({
                    title: 'System-status updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update system-status.');
        } finally {
            setLoading(false);
        }
    };

    const deleteSystem = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/system-status/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setSystems((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'System status deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete system-status.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete system-status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystems();
    }, []);

    return {
        systems,
        loading,
        error,
        fetchSystems,
        createSystem,
        updateSystem,
        deleteSystem,
    };
}

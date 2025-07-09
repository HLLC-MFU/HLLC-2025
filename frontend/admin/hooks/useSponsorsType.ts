import { useEffect, useState } from "react";
import { apiRequest } from '@/utils/api';
import { addToast } from "@heroui/react";
import { SponsorType } from "@/types/sponsors";

export function useSponsorsType() {
    const [sponsorsType, setSponsorsType] = useState<SponsorType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);

    const fetchSponsorsType = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: SponsorType[] }>(
                '/sponsors/types?limit=0',
                'GET',
            );

            setSponsorsType(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch sponsors type. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch sponsors type.'
                    : 'Failed to fetch sponsors type.',
            );
        } finally {
            setLoading(false);
        }
    };

    const createSponsorsType = async (sponsorsTypeData: Partial<SponsorType>) => {
        try {
            setLoading(true);
            const res = await apiRequest<SponsorType>('/sponsors/types', 'POST', sponsorsTypeData);

            if (res.data) {
                setSponsorsType((prev) => [...prev, res.data as SponsorType]);
                addToast({
                    title: 'Sponsors type created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create sponsors type.');
        } finally {
            setLoading(false);
        }
    };

    const updateSponsorsType = async (
        id: string,
        sponsorsData: Partial<SponsorType>,
    ): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest<SponsorType>(
                `/sponsors/types/${id}`,
                'PATCH',
                sponsorsData,
            );

            if (res.data) {
                setSponsorsType((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
                addToast({
                    title: 'Sponsors type updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update type.');
        } finally {
            setLoading(false);
        }
    };

    const deleteSponsorsType = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/sponsors/types/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setSponsorsType((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'Sponsors type deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete type.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete type.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsorsType();
    }, []);

    return {
        sponsorsType,
        loading,
        error,
        fetchSponsorsType,
        createSponsorsType,
        updateSponsorsType,
        deleteSponsorsType,
    }
}
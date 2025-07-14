import { useEffect, useState } from "react";
import { Landmark } from "@/types/landmark";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";

export function useLandmarks() {
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchLandmarks = async () => {
        setLoading(true);
        setError(null)
        try {
            const res = await apiRequest<{ data: Landmark[] }>(
                "/landmarks",
                 "GET"
                );

            setLandmarks(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (error) {
            addToast({
                title: 'Failed to fetch landmarks. Please try again.',
                color: 'danger'
            })
            setError(error && typeof error === 'object' && 'message' in error
                ? (error as { message?: string }).message || 'Failed to fetch landmarks.'
                : 'Failed to fetch landmarks.');
        } finally {
            setLoading(false);
        }
    }

    const createLandmark = async (landmark: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Landmark }>(
                "/landmarks", 
                "POST", landmark
            );

            setLandmarks(prev => [...prev, res.data as unknown as Landmark]);
        } catch (error) {
            addToast({
                title: 'Failed to create landmark. Please try again.',
                color: 'danger'
            })
            setError(error && typeof error === 'object' && 'message' in error
                ? (error as { message?: string }).message || 'Failed to create landmark.'
                : 'Failed to create landmark.');
        } finally {
            setLoading(false);
        }
    }

    const updateLandmark = async (id: string, landmark: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Landmark }>(
                `/landmarks/${id}`,
                "PUT", landmark
            );

            setLandmarks(prev => prev.map(landmark => landmark._id === id ? res.data as unknown as Landmark : landmark));
            
            addToast({
                title: 'Landmark updated successfully!',
                color: 'success'
            });
        } catch (err) {
            addToast({
                title: 'Failed to update landmark. Please try again.',
                color: 'danger'
            })
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update landmark.'
                    : 'Failed to update landmark.'
            )
        } finally {
            setLoading(false);
        }
    }

    const deleteLandmark = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiRequest<{ data: Landmark }>(`/landmarks/${id}`, "DELETE");
            
            setLandmarks(prev => prev.filter(landmark => landmark._id !== id));
            
            addToast({
                title: 'Landmark deleted successfully!',
                color: 'success'
            });
        } catch (err) {
            addToast({
                title: 'Failed to delete landmark. Please try again.',
                color: 'danger'
            })
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to delete landmark.'
                : 'Failed to delete landmark.'
            )
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLandmarks();
    }, []);

    return {
        landmarks,
        loading,
        error,
        fetchLandmarks,
        createLandmark,
        updateLandmark,
        deleteLandmark
    }
}
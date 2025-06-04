import { Sponsor } from "@/types/sponsor";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

export function useSponsor() {
    const [sponsor, setSponsor] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSponsor = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Sponsor[] }>(
                '/sponsors?limit=0',
                'GET',
            );

            setSponsor(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch sponsor. Please try again. ',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch sponsor.'
                    : 'Failed to fetch sponsor',
            );
        } finally {
            setLoading(false);
        }
    };

    const createSponsor = async (sponsorData: Partial<Sponsor>): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest<Sponsor>('/sponsors', 'POST', sponsorData);

            if (res.data) {
                setSponsor((prev) => [...prev, res.data as Sponsor]);
                addToast({
                    title: 'Sponsor created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create sponsor.');
        } finally {
            setLoading(false);
        }
    };

    const updateSponsor = async (
    id: string,
    sponsorData: Partial<Sponsor>, // แก้ชื่อพารามิเตอร์
): Promise<void> => {
    try {
        setLoading(true);
        const res = await apiRequest<Sponsor>(
            `/sponsors/${id}`,
            'PATCH',
            sponsorData,
        );

        if (res.data) {
            setSponsor((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
            addToast({
                title: 'Sponsor updated successfully!',
                color: 'success',
            });
        }
    } catch (err: any) {
        setError(err.message || 'Failed to update sponsor');
    } finally {
        setLoading(false);
    }
};

    const deleteSponsor = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/sponsors/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setSponsor((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'Sponsor deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete sponsor');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete sponsor.');
        } finally {
            setLoading(false);
        }
    };

    const createSponsorType = async (typeData: { name: string }): Promise<void> => {
    try {
        setLoading(true);
        const res = await apiRequest('/sponsor-types', 'POST', typeData);
        if (res.data) {
            addToast({
                title: 'Sponsor type created successfully!',
                color: 'success',
            });
        }
    } catch (err: any) {
        addToast({
            title: 'Failed to create sponsor type.',
            color: 'danger',
        });
        setError(err.message || 'Failed to create sponsor type.');
    } finally {
        setLoading(false);
    }
};

    const editSponsor = async (sponsorData: Partial<Sponsor>): Promise<void> => {
        if (!sponsorData._id || !sponsorData.name) return;
        setLoading(true);
        try {
            const res = await apiRequest(
                `/sponsors/${sponsorData._id}`,
                'PATCH',
                sponsorData,
            );

            if (res.data) {
                addToast({
                    title: 'Sponsor added successfully!',
                    color: 'success'
                });
                await fetchSponsor();
            }
        } catch (err: any) {
            addToast({
                title: 'Failed to update sponsor. Please try again,',
                color: 'danger'
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update sponsor'
                    : 'Failed to update sponsor'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsor();
    }, []);

    return {
        sponsor,
        loading,
        error,
        fetchSponsor,
        createSponsor,
        updateSponsor,
        deleteSponsor,
        editSponsor,
    };
}
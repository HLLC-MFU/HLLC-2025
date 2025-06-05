import { Sponsors } from "@/types/sponsors";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export function useSponsors() {
    const [sponsors, setSponsors] = useState<Sponsors[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)

    // Fetch all sponsors
    const fetchSponsors = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Sponsors[] }>("/sponsors?limit=0", "GET");

            setSponsors(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch sponsors.'
                    : 'Failed to fetch sponsors.',
            );
        } finally {
            setLoading(false);
        }
    };

    // Create sponsor
    const createSponsor = async (sponsorsData: Partial<Sponsors>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Sponsors>("/sponsors", "POST", sponsorsData);
            console.log("Create response: ", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setSponsors((prev) => {
                        const updated = [...prev, res.data as Sponsors];
                        resolve(updated);
                        return updated;
                    });
                });
            }
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create sponsors.'
                    : 'Failed to create sponsors.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    return {
        sponsors,
        loading,
        error,
        fetchSponsors,
        createSponsor,
    };
}
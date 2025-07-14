import { Sponsors } from "@/types/sponsors";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export default function useSponsers() {
    const [sponsors, setSponsors] = useState<Sponsors[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evouchers
    const fetchSponsors = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest<Sponsors>('/sponsors?limit=0', 'GET');

            if (response.data) {
                setSponsors(Array.isArray(response.data) ? response.data : []);
            }
            return response;
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch sponsors.'
                : 'Failed to fetch sponsors.';
            setError(errorMessage);
            throw err;
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
    }
}
import { useEffect, useState } from "react";
import { apiRequest } from "@/utils/api";
import { Appearance } from "@/types/appearance";

export function useSchoolByAppearance(appearanceId?: string) {
    const [appearance, setAppearance] = useState<Appearance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);



    const fetchSchoolAppearance = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<Appearance>(
                `/schools/${appearanceId}/appearances`,
                "GET"
            );
            console.log('Fetched appearance from API:', res.data);
            if (res.data) {
                setAppearance(res.data);
            } else {
                setAppearance(null);
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch school appearance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!appearanceId) return;
        fetchSchoolAppearance();
    }, [appearanceId]);

    return {
        appearance,
        loading,
        error,
        setAppearance
    };
}

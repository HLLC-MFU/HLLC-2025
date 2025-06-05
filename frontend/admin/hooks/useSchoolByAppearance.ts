import { useEffect, useState } from "react";
import { apiRequest } from "@/utils/api";
import { Appearance } from "@/types/appearance";

export function useSchoolByAppearance(id?: string) {
    const [appearance, setAppearance] = useState<Appearance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSchoolAppearance = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Appearance[] }>(
                `/schools/${id}/appearances`,
                "GET"
            );
            console.log("Fetched appearance array:", res.data);

            if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                // Ensure all required assets fields exist
                const appearanceData = res.data.data[0];

                setAppearance(prev => ({
                    ...prev,
                    ...appearanceData,
                    assets: {
                        ...(prev?.assets || {}),
                        ...appearanceData.assets
                    }
                }));


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
        if (!id) return;
        fetchSchoolAppearance();
    }, [id]);

    return {
        appearance,
        loading,
        error,
        setAppearance
    };
}

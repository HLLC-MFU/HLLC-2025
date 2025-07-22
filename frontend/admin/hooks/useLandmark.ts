import { Landmark } from "@/types/coin-hunting";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export function useLandmark() {
    const [landmark, setLandmark] = useState<Landmark[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSponsorLandmark = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{
                message: string;
                data: Landmark[];
            }>("/landmarks/sponsor", "GET");

            if (res && res.data && Array.isArray(res.data.data)) {
                setLandmark(res.data.data);
                console.log('เอามาดู landmark sponsor data ทั้งหมด', res);

            } else {
                setLandmark([]);
            }
        } catch (err) {
            setError("Failed to fetch landmark.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchSponsorLandmark();
    }, []);

    return {
        landmark,
        loading,
        error,
        refetch: fetchSponsorLandmark
    };
}
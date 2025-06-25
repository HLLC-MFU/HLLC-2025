import { useEffect, useState } from "react";
import useProfile from "./useProfile";
import { Appearance } from "@/types/appearance";
import { apiRequest } from "@/utils/api";

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>();
    const [assets, setAssets] = useState<Record<string, string>>();
    const { user } = useProfile();
    const schoolId = user?.data?.[0].metadata.major.school._id;

    const fetchSchoolAppearance = async () => {
        try {
            const res = await apiRequest<Appearance>(`/schools/${schoolId}/appearances`, "GET");
            if (res.statusCode !== 200 || !res.data) {
                throw new Error(res.message || "Failed to fetch appearance");
            }

            setAppearance(res.data);
            setAssets(res.data.data[0].assets);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unexpected error";
            // set({ error: message, loading: false, hasFetched: true });
        }
    };

    useEffect(() => {
        if (schoolId) fetchSchoolAppearance();
    }, [schoolId]);

    return {
        appearance,
        assets,
    };
}

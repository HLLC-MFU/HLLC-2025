import { Appearance } from "@/types/appearance";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";
import { useProfile } from "./useProfile";

export function useAppearances() {
    const [assets, setAssets] = useState<Record<string, string>>();
    const { user } = useProfile();
    const schoolId = user?.metadata?.major?.school?._id ?? null;

    const fetchSchoolAppearance = async () => {
        try {
            const res = await apiRequest<{ data: Appearance[] }>(`/schools/${schoolId}/appearances`, "GET");
            if (res.statusCode !== 200 || !res.data) {
                throw new Error(res.message || "Failed to fetch appearance");
            }

            setAssets(res.data.data[0].assets);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unexpected error";
        }
    };

    useEffect(() => {
        if (schoolId) fetchSchoolAppearance();
    }, [schoolId]);

    return {
        assets,
    };
}
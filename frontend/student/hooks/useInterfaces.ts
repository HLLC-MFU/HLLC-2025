import { useEffect, useState } from "react";
import useProfile from "./useProfile";
import { Interfaces } from "@/types/interfaces";
import { apiRequest } from "@/utils/api";

export function useInterfaces() {
    const [interfaces, setInterfaces] = useState<Interfaces>();
    const [assets, setAssets] = useState<Record<string, string>>();
    const { user } = useProfile();
    const schoolId = user?.data?.[0].metadata.major.school._id;

    const fetchInterfacesBySchool = async () => {
        try {
            const res = await apiRequest<Interfaces>(`/schools/${schoolId}/interfaces`, "GET");
            if (res.statusCode !== 200 || !res.data) {
                throw new Error(res.message || "Failed to fetch interfaces");
            }

            setInterfaces(res.data);
            setAssets(res.data.data[0].assets);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unexpected error";
            // set({ error: message, loading: false, hasFetched: true });
        }
    };

    useEffect(() => {
        if (schoolId) fetchInterfacesBySchool();
    }, [schoolId]);

    return {
        interfaces,
        assets,
    };
}

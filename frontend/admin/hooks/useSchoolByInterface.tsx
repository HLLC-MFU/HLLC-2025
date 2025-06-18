import { Interfaces } from "@/types/interfaces";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export function useSchoolByInterface(id?: string) {
    const [interfaces, setInterfaces] = useState<Interfaces | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // console.log(interfaces);

    const fetchSchoolInterface = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Interfaces[] }>(`/schools/${id}/interfaces`, "GET");

            if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const interfaceData = res.data.data[0];

                setInterfaces(prev => ({
                    ...prev,
                    ...interfaceData,
                    assets: {
                        ...(prev?.assets || {}),
                        ...interfaceData.assets
                    }
                }))
            } else {
                setInterfaces(null);
            }
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch school interface.'
                    : 'Failed to fetch school interface.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        fetchSchoolInterface();
    }, [id])

    return {
        interfaces,
        loading,
        error,
        setInterfaces,
    }
}
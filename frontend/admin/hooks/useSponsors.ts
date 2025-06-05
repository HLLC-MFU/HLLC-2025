import { Sponsors } from "@/types/sponsors";
import { apiRequest } from "@/utils/api";
import { useState, useEffect } from "react";


export function useSponsors() {
    const [sponsors, setSponsors] = useState<Sponsors[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSponsors = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await apiRequest<{ data: Sponsors[] }>("/sponsors?limit=0", "GET");
            setSponsors(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch sponsors.");
        } finally {
            setLoading(false);
        }
    }

    const createSponsor = async (sponsorData: Partial<Sponsors>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Sponsors>("/sponsors", "POST", sponsorData);
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
        } catch (err: any) {
            setError(err.message || "Failed to create sponsor.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSponsors();
    }, []);
    return{ sponsors, loading, error, fetchSponsors, createSponsor };
}
import { Appearance } from "@/types/appearance";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export default function useAppearance() {
    const [appearances, setAppearances] = useState<Appearance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const fetchAppearances = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await apiRequest<{ data: Appearance[] }>("/appearances", "GET");
            setAppearances(Array.isArray(res.data?.data) ? res.data.data : []);
            console.log(res);
            
        } catch (err: any) {
            setError(err.message || "Failed to fetch appearances.")
        }
        setLoading(false);
    }

    const createAppearance = async (appearanceData: Partial<Appearance>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Appearance>("/appearances", "POST", appearanceData);
            console.log("Create response:", res);
            if (res.data) {
                await new Promise((resolve) => {
                    setAppearances((prev) => {
                        const update = [...prev, res.data as Appearance];
                        resolve(update);
                        return update;
                    });
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create appearance.")
        } finally {
            setLoading(false);
        }
    }

    const updateAppearance = async (id: string, appearancelData: Partial<Appearance>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Appearance>(`/appearances/${id}`, "PATCH", appearancelData);
            if (res.data) {
                setAppearances((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
            }
        } catch (err: any) {
            setError(err.message || "Failed to update appearance.");
        } finally {
            setLoading(false);
        }
    };

    const deleteAppearance = async (id: string) => {
        try {
            setLoading(true);
            const res = await apiRequest(`/appearances/${id}`, "DELETE");
            console.log("Delete response:", res);
            if (res.statusCode !== 200) {
                throw new Error(res.message || "Failed to delete appearance.");
            } else {
                setAppearances((prev) => prev.filter((s) => s._id !== id));
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete appearance.");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchAppearances();
    }, [])

    return {
        appearances,
        loading,
        error,
        fetchAppearances,
        createAppearance,
        updateAppearance,
        deleteAppearance,
    }

}
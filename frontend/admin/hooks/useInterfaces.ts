import { Interfaces } from "@/types/interfaces";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useState } from "react";

export default function useInterfaces() {
    const [interfaces, setInterfaces] = useState<Interfaces[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateInterfaces = async (id: string, interfacesData: FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<Interfaces>(`/interfaces/${id}`, "PATCH", interfacesData);
            if (res.data) {
                setInterfaces((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
                addToast({
                    title: 'Interfaces updated successfully',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to update interface.");
        } finally {
            setLoading(false);
        }
    };

    return {
        interfaces,
        loading,
        error,
        updateInterfaces,
    }
}
import { Role } from "@/types/user";
import { apiRequest } from "@/utils/api";
import { useState, useEffect } from "react";

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all roles
    const fetchRoles = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await apiRequest<{ data: Role[] }>("/roles?limit=0", "GET");
            setRoles(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    // Create new role
    const createRole = async (roleData: Partial<Role>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Role>("/roles", "POST", roleData);
            console.log("Create response: ", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setRoles((prev) => {
                        const updated = [...prev, res.data as Role];
                        resolve(updated);
                        return updated;
                    });
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [])

    return {
        roles,
        loading,
        error,
        fetchRoles,
        createRole,
    }
};
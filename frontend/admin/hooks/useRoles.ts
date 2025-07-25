import { useState, useEffect } from "react";

import { apiRequest } from "@/utils/api";
import { Role } from "@/types/role";
import { addToast } from "@heroui/react";

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

            if (res.data) {
                await new Promise((resolve) => {
                    setRoles((prev) => {
                        const updated = [...prev, res.data as Role];

                        resolve(updated);

                        return updated;
                    });
                    addToast({
                        title: "Role created successfully",
                        description: "Role created successfully",
                        color: "success",
                    })
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    // Update role
    const updateRole = async (id: string, roleData: Partial<Role>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Role>(`/roles/${id}`, "PATCH", roleData);
            if (res.data) {
                setRoles((prev) => prev.map((r) => (r._id === id ? res.data! : r)));
                addToast({
                    title: "Role updated successfully",
                    description: "Role updated successfully",
                    color: "success",
                })
            }
            return res;
        } catch (err: any) {
            setError(err.message || "Failed to update role.");
        } finally {
            setLoading(false);
        }
    };

    // Delete role
    const deleteRole = async (id: string) => {
        try {
            setLoading(true);
            const res = await apiRequest(`/roles/${id}`, "DELETE");
            if (res.statusCode === 200) {
                setRoles((prev) => prev.filter((r) => r._id !== id));
                addToast({
                    title: "Role deleted successfully",
                    description: "Role deleted successfully",
                    color: "success",
                })
            }
            return res;
        } catch (err: any) {
            setError(err.message || "Failed to delete role.");
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
        updateRole,
        deleteRole,
    }
};
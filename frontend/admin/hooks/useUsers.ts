import { useState, useEffect } from "react";

import { User } from "@/types/user";
import { apiRequest } from "@/utils/api";

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: User[] }>("/users?limit=0", "GET");

            setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    //Fetch user by username
    const fetchByUsername = async (username: string) => {
        console.log('fetchByUsername called with:', username);
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: User[] }>(`/users?username=${username}`, "GET");

            console.log('fetchByUsername response:', res);
            const users = Array.isArray(res.data?.data) ? res.data.data : [];
            console.log('Found users:', users.length, 'users:', users);
            
            setUsers(users);
            return users;
        } catch (err: any) {
            console.error('Error fetching users by username:', err);
            setError(err.message || "Failed to fetch users.");
            return [];
        } finally {
            setLoading(false);
        }
    };


    // Create new user
    const createUser = async (userData: Partial<User>) => {
        try {
            setLoading(true);
            const res = await apiRequest<User>("/users", "POST", userData);

            if (res.data) {
                await new Promise((resolve) => {
                    setUsers((prev) => {
                        const updated = [...prev, res.data as User];

                        resolve(updated);

                        return updated;
                    });
                });
            }

            return res;
        } catch (err: any) {
            setError(err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    // Upload users
    const uploadUser = async (userData: Partial<User>[]) => {
        try {
            setLoading(true);
            const res = await apiRequest<User>("/users/upload", "POST", userData);

            if (res.data) {
                await new Promise((resolve) => {
                    setUsers((prev) => {
                        const updated = [...prev, res.data as User];

                        resolve(updated);

                        return updated;
                    });
                });
            }

            return res;
        } catch (err: any) {
            setError(err.message || "Failed to upload users.");
        } finally {
            setLoading(false)
        }
    };

    // Update user 
    const updateUser = async (id: string, userData: Partial<User>) => {
        try {
            setLoading(true);
            const res = await apiRequest<User>(`/users/${id}`, "PATCH", userData);

            if (res.data) {
                setUsers((prev) => prev.map((u) => (u._id === id ? res.data! : u)));
            }

            return res;
        } catch (err: any) {
            setError(err.message || "Failed to update user.");
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const deleteUser = async (id: string) => {
        try {
            setLoading(true);
            const res = await apiRequest(`/users/${id}`, "DELETE");

            if (res.statusCode !== 200) {
                throw new Error(res.message || "Failed to delete user.");
            } else {
                setUsers((prev) => prev.filter((u) => u._id !== id));
            }

            return res;
        } catch (err: any) {
            setError(err.message || "Failed to delete user.");
        } finally {
            setLoading(false);
        }
    };

    // Multiple delete
    const deleteMultiple = async (ids: string[]) => {
        try {
            setLoading(true);

            const res = await apiRequest("/users/multiple", "DELETE", ids);

            if (res.statusCode !== 200) {
                throw new Error(res.message || "Failed to delete user.");
            } else {
                setUsers((prev) => prev.filter((u) => !ids.includes(u._id)));
            }

            return res;
        } catch (err: any) {
            setError(err.message || "Failed to delete user.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        error,
        fetchUsers,
        fetchByUsername,
        createUser,
        uploadUser,
        updateUser,
        deleteUser,
        deleteMultiple,
    };
};
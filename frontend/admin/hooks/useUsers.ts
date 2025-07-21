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

    const trimUser = (user: Partial<User>): Partial<User> => ({
        ...user,
        name: user.name
            ? {
                first: user.name.first?.trim() ?? '',
                middle: user.name.middle?.trim(),
                last: user.name.last?.trim() ?? '',
            }
            : undefined,
    });


    // Define a constant for your batch size
    const BATCH_SIZE = 100;

    /**
     * Uploads user data in batches to the backend.
     *
     * @param allUserData An array of user data (Partial<User>) to be uploaded.
     * @returns A Promise that resolves when all batches are processed.
     */
    const uploadUser = async (allUserData: Partial<User>[]) => {
        setLoading(true);
        setError(null);

        // 🧹 Step 1: Trim all input before processing
        const cleanedUserData = allUserData.map(trimUser);

        const uploadedUsers: User[] = [];
        let hasErrorOccurred = false;

        try {
            const numBatches = Math.ceil(cleanedUserData.length / BATCH_SIZE);

            for (let i = 0; i < numBatches; i++) {
                const start = i * BATCH_SIZE;
                const end = start + BATCH_SIZE;
                const batch = cleanedUserData.slice(start, end); // ✅ Already trimmed

                console.log(`Uploading batch ${i + 1}/${numBatches} (${batch.length} users)...`);

                try {
                    const res = await apiRequest<User[]>("/users/upload", "POST", batch);

                    if (res.data && Array.isArray(res.data)) {
                        uploadedUsers.push(...res.data);

                        await new Promise<void>((resolve) => {
                            setUsers((prev) => {
                                const updated = [...prev, ...res.data as User[]];
                                resolve();
                                return updated;
                            });
                        });

                        console.log(`Batch ${i + 1} uploaded successfully.`);
                    } else {
                        console.warn(`Batch ${i + 1} upload: Unexpected response data format.`, res.data);
                        setError(`Batch ${i + 1} upload failed: Unexpected response format.`);
                        hasErrorOccurred = true;
                    }
                } catch (batchErr: any) {
                    console.error(`Error uploading batch ${i + 1}:`, batchErr);
                    setError(`Batch ${i + 1} upload failed: ${batchErr.message || "Unknown error"}`);
                    hasErrorOccurred = true;
                }
            }
        } catch (overallErr: any) {
            console.error("Overall upload process error:", overallErr);
            setError(overallErr.message || "Overall upload process failed.");
            hasErrorOccurred = true;
        } finally {
            setLoading(false);
            if (hasErrorOccurred) {
                console.warn("Some batches failed during the upload process. Check logs for details.");
            } else {
                console.log("All batches processed successfully.");
            }

            return { data: uploadedUsers, error: hasErrorOccurred ? "Some batches failed" : null };
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
import { useState, useEffect } from "react";
import { apiRequest, ApiResponse } from "@/utils/api";
import { EvoucherCode } from "@/types/evoucher-code";
import { addToast } from "@heroui/react";

export function useEvoucherCode() {
    const [evoucherCodes, setEvoucherCodes] = useState<EvoucherCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evoucher codes
    const fetchEvoucherCodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: EvoucherCode[] }>("/evoucher-code?limit=0", "GET");
            const evoucherCodeData = res.data?.data ?? [];
            setEvoucherCodes(evoucherCodeData);
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evoucher codes.';
            setError(errorMessage);
            addToast({
                title: "Error",
                description: errorMessage,
                color: "danger"
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch single evoucher code
    const fetchEvoucherCodeById = async (id: string): Promise<EvoucherCode | null> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: EvoucherCode }>(`/evoucher-code/${id}`, "GET");
            return res.data?.data || null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evoucher code.';
            setError(errorMessage);
            addToast({
                title: "Error",
                description: errorMessage,
                color: "danger"
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Create evoucher code
    const createEvoucherCode = async (evoucherCodeData: Partial<EvoucherCode>): Promise<void> => {
        try {
            setLoading(true);

            const payload = {
                user: typeof evoucherCodeData.user === "string" ? evoucherCodeData.user : evoucherCodeData.user?._id,
                evoucher: typeof evoucherCodeData.evoucher === "string" ? evoucherCodeData.evoucher : evoucherCodeData.evoucher?._id,
            };

            const res = await apiRequest<EvoucherCode>("/evoucher-code", "POST", payload);

            if (res.data) {
                setEvoucherCodes((prev) => res.data ? [...prev, res.data] : prev);
                addToast({
                    title: "Evoucher code created successfully!",
                    color: "success",
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create evoucher code.";
            setError(msg);
            addToast({
                title: "Error",
                description: msg,
                color: "danger",
            });
        } finally {
            setLoading(false);
        }
    };



    // Update evoucher code
    const updateEvoucherCode = async (evoucherCodeId: string, formData: FormData): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            // First fetch the current data
            const currentData = await fetchEvoucherCodeById(evoucherCodeId);
            if (!currentData) {
                throw new Error('Failed to fetch current evoucher code data');
            }

            // Convert FormData to JSON object
            const jsonData = {
                evoucher: formData.get('evoucher') || currentData.evoucher,
                user: formData.get('user') || currentData.user,
                metadata: {
                    expiration: formData.get('metadata[expiration]') || currentData.metadata.expiration
                }
            };

            const res = await apiRequest<{ data: EvoucherCode }>(
                `/evoucher-code/${evoucherCodeId}`,
                "PATCH",
                jsonData
            );

            if (res?.data?.data) {
                const updatedEvoucherCode = res.data.data;
                setEvoucherCodes(prev =>
                    prev.map(code =>
                        code._id === evoucherCodeId ? updatedEvoucherCode : code
                    )
                );

                addToast({
                    title: "Success",
                    description: "Evoucher code updated successfully",
                    color: "success"
                });
            }
            return res;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update evoucher code.';
            setError(errorMessage);
            addToast({
                title: "Error",
                description: errorMessage,
                color: "danger"
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete evoucher code
    const deleteEvoucherCode = async (evoucherCodeId: string): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: EvoucherCode }>(`/evoucher-code/${evoucherCodeId}`, "DELETE");

            if (res) {
                setEvoucherCodes(prev => prev.filter(code => code._id !== evoucherCodeId));
                addToast({
                    title: "Success",
                    description: "Evoucher code deleted successfully",
                    color: "success"
                });
            }
            return res;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to delete evoucher code.';
            setError(errorMessage);
            addToast({
                title: "Error",
                description: errorMessage,
                color: "danger"
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvoucherCodes();
    }, []);

    return {
        evoucherCodes,
        loading,
        error,
        createEvoucherCode,
        updateEvoucherCode,
        deleteEvoucherCode,
        fetchEvoucherCodeById,
        fetchEvoucherCodes,
    };
}

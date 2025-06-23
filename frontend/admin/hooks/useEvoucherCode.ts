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
    const fetchEvoucherCode = async (id: string): Promise<EvoucherCode | null> => {
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
    const createEvoucherCode = async (formData: FormData): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            // Convert FormData to JSON object
            const jsonData = {
                evoucher: formData.get('evoucher'),
                user: formData.get('user'),
                metadata: {
                    expiration: formData.get('metadata[expiration]')
                }
            };

            console.log('Creating evoucher code with data:', jsonData);

            const res = await apiRequest<{ data: EvoucherCode }>(
                "/evoucher-code",
                "POST",
                jsonData
            );
            
            console.log('API Response:', res);
            
            if (res?.data?.data) {
                const newEvoucherCode = res.data.data;
                console.log('Adding new evoucher code to state:', newEvoucherCode);
                setEvoucherCodes(prev => {
                    const updated = [...prev, newEvoucherCode];
                    console.log('Updated evoucher codes state:', updated);
                    return updated;
                });
                addToast({
                    title: "Success",
                    description: "Evoucher code created successfully",
                    color: "success"
                });
            }
            return res;
        } catch (err: any) {
            console.error('Error creating evoucher code:', err);
            let errorMessage = 'Failed to create evoucher code.';
            
            // Handle specific error messages
            if (err.message === 'Evoucher expired') {
                errorMessage = 'Cannot create code: The selected evoucher has expired.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

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

    // Update evoucher code
    const updateEvoucherCode = async (evoucherCodeId: string, formData: FormData): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            // First fetch the current data
            const currentData = await fetchEvoucherCode(evoucherCodeId);
            if (!currentData) {
                throw new Error('Failed to fetch current evoucher code data');
            }

            // Convert FormData to JSON object
            const jsonData = {
                evoucher: formData.get('evoucher') || currentData.evoucher?._id,
                user: formData.get('user') || currentData.user?._id,
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
        fetchEvoucherCode,
    };
}
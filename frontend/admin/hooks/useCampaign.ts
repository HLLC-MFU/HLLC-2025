import { useState, useEffect } from "react";
import { Campaign } from "@/types/campaign";
import { useApi } from "./useApi";

interface CampaignResponse {
    data: Campaign[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        lastUpdatedAt: string;
    };
    message: string;
}

export const useCampaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const api = useApi();

    const fetchCampaigns = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.request("/campaigns", "GET");
            if (response && Array.isArray(response)) {
                setCampaigns(response);
            } else if (response?.data && Array.isArray(response.data)) {
                setCampaigns(response.data);
            } else {
                console.error("Invalid response format:", response);
                setCampaigns([]);
            }
        } catch (err: any) {
            console.error("Error fetching campaigns:", err);
            setError(err.message || "Failed to fetch campaigns.");
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    const createCampaign = async (formData: FormData) => {
        try {
            const response = await api.request("/campaigns", "POST", formData);
            if (
                response &&
                typeof response === "object" &&
                "data" in response &&
                Array.isArray((response as { data: unknown }).data)
            ) {
                const data = (response as { data: unknown }).data;
                setCampaigns(prev => [...prev, (data as Campaign[])[0]]);
            }
            return response;
        } catch (error) {
            console.error("Error in createCampaign:", error);
            throw error;
        }
    };

    const updateCampaign = async (id: string, formData: FormData) => {
        try {
            const response = await api.request(`/campaigns/${id}`, "PATCH", formData);
            if (
                response &&
                typeof response === "object" &&
                "data" in response &&
                Array.isArray((response as { data: unknown }).data)
            ) {
                const data = (response as { data: unknown[] }).data as Campaign[];
                setCampaigns(prev => prev.map(c => c._id === id ? data[0] : c));
            }
            return response;
        } catch (error) {
            console.error("Error in updateCampaign:", error);
            throw error;
        }
    };

    const deleteCampaign = async (id: string) => {
        try {
            const response = await api.request(`/campaigns/${id}`, "DELETE");
            setCampaigns(prev => prev.filter(c => c._id !== id));
            return response;
        } catch (error) {
            console.error("Error in deleteCampaign:", error);
            throw error;
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    return {
        campaigns,
        loading,
        error,
        fetchCampaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
    };
}; 
import { useState, useEffect } from "react";

import { useApi } from "./useApi";

import { Campaign } from "@/types/campaign";

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

            console.log("Fetch response:", response);
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
            console.log("Creating campaign with data:", Object.fromEntries(formData));
            const response = await api.request("/campaigns", "POST", formData);

            console.log("Create campaign response:", response);
            if (response?.data && Array.isArray(response.data)) {
                setCampaigns(prev => [...prev, response.data[0] as Campaign]);
            }

            return response;
        } catch (error) {
            console.error("Error in createCampaign:", error);
            throw error;
        }
    };

    const updateCampaign = async (id: string, formData: FormData) => {
        try {
            console.log("Updating campaign with data:", Object.fromEntries(formData));
            const response = await api.request(`/campaigns/${id}`, "PATCH", formData);

            console.log("Update campaign response:", response);
            if (response?.data && Array.isArray(response.data)) {
                setCampaigns(prev => prev.map(c => c._id === id ? response.data[0] as Campaign : c));
            }

            return response;
        } catch (error) {
            console.error("Error in updateCampaign:", error);
            throw error;
        }
    };

    const deleteCampaign = async (id: string) => {
        try {
            console.log("Deleting campaign:", id);
            const response = await api.request(`/campaigns/${id}`, "DELETE");

            console.log("Delete campaign response:", response);
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
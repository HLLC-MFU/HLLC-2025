import { useState, useEffect } from "react";
import { Campaign } from "@/types/campaign";

export const useCampaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/campaigns");
            const data = await response.json();
            setCampaigns(data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const createCampaign = async (campaignData: Partial<Campaign>) => {
        try {
            const response = await fetch("/api/campaigns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(campaignData),
            });
            const newCampaign = await response.json();
            setCampaigns((prev) => [...prev, newCampaign]);
        } catch (error) {
            console.error("Error creating campaign:", error);
            throw error;
        }
    };

    const updateCampaign = async (id: string, campaignData: Partial<Campaign>) => {
        try {
            const response = await fetch(`/api/campaigns/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(campaignData),
            });
            const updatedCampaign = await response.json();
            setCampaigns((prev) =>
                prev.map((campaign) =>
                    campaign._id === id ? updatedCampaign : campaign
                )
            );
        } catch (error) {
            console.error("Error updating campaign:", error);
            throw error;
        }
    };

    const deleteCampaign = async (id: string) => {
        try {
            await fetch(`/api/campaigns/${id}`, {
                method: "DELETE",
            });
            setCampaigns((prev) => prev.filter((campaign) => campaign._id !== id));
        } catch (error) {
            console.error("Error deleting campaign:", error);
            throw error;
        }
    };

    return {
        campaigns,
        loading,
        createCampaign,
        updateCampaign,
        deleteCampaign,
    };
}; 
import { useState } from "react";
import { RestrictionAction, RestrictionResponse } from "@/types/chat";
import { getToken } from "@/utils/storage";

const CHAT_API_BASE_URL = process.env.GO_PUBLIC_API_URL || "http://localhost:1334/api";

async function restrictionApiRequest<T>(endpoint: string, method: "POST" | "PATCH" | "DELETE", body: object) {
    const token = getToken('accessToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${CHAT_API_BASE_URL}${endpoint}`, {
        method,
        headers,
        credentials: "include",
        body: JSON.stringify(body),
    });
    const data = await response.json();
    return { data, statusCode: response.status, message: data?.message || null };
}

export function useRestriction() {
    const [loading, setLoading] = useState(false);

    const banUser = async (data: RestrictionAction): Promise<RestrictionResponse> => {
        setLoading(true);
        try {
            // Remove restrictorId if present
            const { restrictorId, ...payload } = data;
            const res = await restrictionApiRequest<RestrictionResponse>(
                "/restriction/ban",
                "POST",
                payload
            );
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to ban user`);
            }
            return res.data;
        } finally {
            setLoading(false);
        }
    };

    const muteUser = async (data: RestrictionAction): Promise<RestrictionResponse> => {
        setLoading(true);
        try {
            const { restrictorId, ...payload } = data;
            const res = await restrictionApiRequest<RestrictionResponse>(
                "/restriction/mute",
                "POST",
                payload
            );
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to mute user`);
            }
            return res.data;
        } finally {
            setLoading(false);
        }
    };

    // Add more actions (kick, unban, unmute) as needed

    return {
        loading,
        banUser,
        muteUser,
        // kickUser, unbanUser, unmuteUser (implement if needed)
    };
}

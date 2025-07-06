"use client";

import { useState, useEffect } from "react";
import { Sticker, StickerResponse, StickerDetailResponse } from "../types/sticker";
import { getToken } from "../utils/storage";

// Sticker service API base URL
const STICKER_API_BASE_URL = process.env.GO_PUBLIC_API_URL || "http://localhost:1334/api";

// Custom API request function for sticker service
export async function stickerApiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: object | FormData,
    options: RequestInit = {}
): Promise<{ data: T | null; statusCode: number; message: string | null }> {
    try {
        // Get token from multiple sources
        const token = getToken('accessToken');

        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
        };
        
        // Log warning if no token found
        if (!token) {
            console.warn("No access token found! Request may fail with 401 Unauthorized.");
        }
        
        const response = await fetch(`${STICKER_API_BASE_URL}${endpoint}`, {
            method,
            headers,
            credentials: "include",
            body: body
                ? body instanceof FormData
                    ? (body as FormData)
                    : JSON.stringify(body)
                : undefined,
            ...options,
        });
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.error("401 Unauthorized - Token may be invalid or expired");
            return {
                data: null,
                statusCode: 401,
                message: "Unauthorized - Please login again",
            };
        }

        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        return {
            data: responseData,
            statusCode: response.status,
            message: response.ok ? null : responseData?.message || `HTTP ${response.status}`,
        };
    } catch (error) {
        console.error("Sticker API request error:", error);
        return {
            data: null,
            statusCode: 500,
            message: error instanceof Error ? error.message : "Network error",
        };
    }
}

export function useSticker() {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all stickers from the API.
     * @return {Promise<void>} A promise that resolves when the stickers are fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const fetchStickers = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await stickerApiRequest<StickerResponse>("/stickers", "GET");

            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to fetch stickers`);
            }

            if (res.data && Array.isArray(res.data.data)) {
                setStickers(res.data.data);
            } else if (res.data && Array.isArray(res.data)) {
                setStickers(res.data);
            } else {
                setStickers([]);
            }
        } catch (err) {
            console.error("Fetch stickers error:", err);
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch stickers.'
                    : 'Failed to fetch stickers.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new sticker with the provided data.
     * @param {FormData} stickerData - The data to create the sticker with.
     * @return {Promise<ApiResponse<{ data: Sticker }>>} A promise that resolves when the sticker is created.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const createSticker = async (stickerData: FormData): Promise<{ data: { data: Sticker } | null; statusCode: number; message: string | null }> => {
        try {
            setLoading(true);
            const res = await stickerApiRequest<{ data: Sticker }>("/stickers", "POST", stickerData);
            await fetchStickers();
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create sticker.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing sticker with the provided data.
     * @param {string} id - The ID of the sticker to update.
     * @param {FormData} stickerData - The data to update the sticker with.
     * @return {Promise<ApiResponse<{ data: Sticker }>>} A promise that resolves when the sticker is updated.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const updateSticker = async (id: string, stickerData: FormData): Promise<{ data: { data: Sticker } | null; statusCode: number; message: string | null }> => {
        try {
            setLoading(true);
            const res = await stickerApiRequest<{ data: Sticker }>(`/stickers/${id}`, "PATCH", stickerData);
            await fetchStickers();
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update sticker.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete an existing sticker.
     * @param {string} id - The ID of the sticker to delete.
     * @return {Promise<ApiResponse<{ data: Sticker }>>} A promise that resolves when the sticker is deleted.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const deleteSticker = async (id: string): Promise<{ data: { data: Sticker } | null; statusCode: number; message: string | null }> => {
        setLoading(true);
        try {
            const res = await stickerApiRequest<{ data: Sticker }>(`/stickers/${id}`, "DELETE");
            await fetchStickers();
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete sticker.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get sticker by ID
     * @param {string} stickerId - The ID of the sticker to fetch.
     * @return {Promise<Sticker | null>} A promise that resolves with the sticker data.
     * @throws {Error} If the API request fails, an error is thrown.
     */
    const getStickerById = async (stickerId: string): Promise<Sticker | null> => {
        try {
            setLoading(true);
            
            const res = await stickerApiRequest<StickerDetailResponse>(`/stickers/${stickerId}`, "GET");
            
            if (res.statusCode !== 200) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to fetch sticker`);
            }

            return res.data?.data || null;
        } catch (err) {
            console.error("Fetch sticker error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to fetch sticker.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStickers();
    }, []);

    return {
        stickers,
        loading,
        error,
        fetchStickers,
        createSticker,
        updateSticker,
        deleteSticker,
        getStickerById,
    };
} 
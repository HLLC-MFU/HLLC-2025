"use client";

import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

import { Sticker } from "../types/sticker";

import { apiGolangRequest } from "@/utils/api";

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
            const res = await apiGolangRequest<{ data: Sticker[] }>(
                "/stickers?limit=0",
                "GET",
            );

            setStickers(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch stickers. Please try again.',
                color: 'danger',
            });
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
     * Get sticker by ID
     * @param {string} stickerId - The ID of the sticker to fetch.
     * @return {Promise<Sticker | null>} A promise that resolves with the sticker data.
     * @throws {Error} If the API request fails, an error is thrown.
     */
        const fetchStickerById = async (stickerId: string) => {
            try {
                setLoading(true);
                
                const res = await apiGolangRequest<{ data: Sticker }>(
                    `/stickers/${stickerId}`,
                    "GET",
                );
    
                if (res.data) {
                    return res.data;
                }
            } catch (err) {
                addToast({
                    title: 'Failed to fetch sticker. Please try again.',
                    color: 'danger',
                });
                setError(
                    err && typeof err === 'object' && 'message' in err
                        ? (err as { message?: string }).message || 'Failed to fetch sticker.'
                        : 'Failed to fetch sticker.',
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
    const createSticker = async (stickerData: FormData) => {
        try {
            setLoading(true);
            const res = await apiGolangRequest<{ data: Sticker }>(
                "/stickers",
                "POST",
                stickerData,
            );

            await fetchStickers();

            return res;
        } catch (err) {
            addToast({
                title: 'Failed to create sticker. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create sticker.'
                    : 'Failed to create sticker.',
            );
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
    const updateSticker = async (id: string, stickerData: FormData) => {
        try {
            setLoading(true);
            const res = await apiGolangRequest<{ data: Sticker }>(
                `/stickers/${id}`,
                "PATCH",
                stickerData,
            );

            await fetchStickers();

            return res;
        } catch (err) {
            addToast({
                title: 'Failed to update sticker. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update sticker.'
                    : 'Failed to update sticker.',
            );
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
    const deleteSticker = async (id: string) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<{ data: Sticker }>(
                `/stickers/${id}`,
                "DELETE",
            );

            await fetchStickers();

            return res;
        } catch (err) {
            addToast({
                title: 'Failed to delete sticker. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to delete sticker.'
                    : 'Failed to delete sticker.',
            );
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
        fetchStickerById,
    };
} 
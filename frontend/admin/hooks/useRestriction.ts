import { useState } from "react";
import { addToast } from "@heroui/react";

import { RestrictionAction } from "@/types/chat";
import { apiGolangRequest } from "@/utils/api";

export function useRestriction() {
    const [loading, setLoading] = useState(false);
    const [restriction, setRestriction] = useState<RestrictionAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    /**
     * Ban a user from a room
     * @param data - The data to ban the user
     * @returns The restriction data
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const banUser = async (data: RestrictionAction) => {
        setLoading(true);
        try {

            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/ban",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
            }
        } catch (err) {
            addToast({
                title: 'Failed to ban user. Plesae try again.',
                color: 'danger',
            });
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to ban user.'
                : 'Failed to ban user.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mute a user from a room
     * @param data - The data to mute the user
     * @returns The restriction data
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const muteUser = async (data: RestrictionAction) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/mute",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
            }
        } catch (err) {
            addToast({
                title: 'Failed to mute user. Plesae try again.',
                color: 'danger',
            });
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to mute user.'
                : 'Failed to mute user.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Unban a user from a room
     * @param data - The data to unban the user
     * @returns The restriction data
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const unbanUser = async (data: { userId: string; roomId: string }) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/unban",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
            }
        } catch (err) {
            addToast({
                title: 'Failed to unban user. Please try again.',
                color: 'danger',
            });
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to unban user.'
                : 'Failed to unban user.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Unmute a user from a room
     * @param data - The data to unmute the user
     * @returns The restriction data
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const unmuteUser = async (data: { userId: string; roomId: string }) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/unmute",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
            }
        } catch (err) {
            addToast({
                title: 'Failed to unmute user. Please try again.',
                color: 'danger',
            });
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to unmute user.'
                : 'Failed to unmute user.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get restriction status for a user in a room
     * @param roomId - The room ID
     * @param userId - The user ID
     * @returns The restriction status
     */
    const getRestrictionStatus = async (roomId: string, userId: string) => {
        try {
            const res = await apiGolangRequest<{data: any}>(
                `/restriction/status/${roomId}/${userId}`,
                "GET"
            );
            return res.data?.data;
        } catch (err) {
            console.error('Failed to get restriction status:', err);
            return null;
        }
    };

    /**
     * Get all restriction statuses in a room (optimized for large member lists)
     * @param roomId - The room ID
     * @returns Map of user ID to restriction status
     */
    const getRoomRestrictions = async (roomId: string) => {
        try {
            const res = await apiGolangRequest<{data: Record<string, any>}>(
                `/restriction/room/${roomId}/restrictions`,
                "GET"
            );
            return res.data?.data || {};
        } catch (err) {
            console.error('Failed to get room restrictions:', err);
            return {};
        }
    };

    const kickUser = async (data: RestrictionAction) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/kick",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
            }
        } catch (err) {
            addToast({
                title: 'Failed to kick user. Plesae try again.',
                color: 'danger',
            });
            setError(err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to kick user.'
                : 'Failed to kick user.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get restriction history with filters
     * @param queryString - Query parameters for filtering
     * @returns The restriction history data
     */
    const getRestrictionHistory = async (queryString: string) => {
        try {
            const res = await apiGolangRequest<{
                data: any[];
                meta: {
                    total: number;
                    page: number;
                    limit: number;
                    totalPages: number;
                };
            }>(
                `/restriction/history?${queryString}`,
                "GET"
            );
            return res.data;
        } catch (err) {
            console.error('Failed to get restriction history:', err);
            throw err;
        }
    };

    return {
        loading,
        banUser,
        muteUser,
        unbanUser,
        unmuteUser,
        getRestrictionStatus,
        getRoomRestrictions,
        kickUser,
        getRestrictionHistory,
        error,
        restriction,
    };
}

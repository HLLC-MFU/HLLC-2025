import { useState } from "react";
import { addToast } from "@heroui/react";

import type { RestrictionAction } from "@/types/chat";
import { apiGolangRequest } from "@/utils/api";

export function useRestriction() {
    const [loading, setLoading] = useState(false);
    const [restriction, setRestriction] = useState<RestrictionAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    /**
     * Ban a user from a room
     * @param data - The restriction data for banning the user
     * @returns Promise<void>
     */
    const banUser = async (data: RestrictionAction): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/ban",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
                addToast({
                    title: 'User banned successfully!',
                    color: 'success',
                });
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to ban user.'
                : 'Failed to ban user.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to ban user. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mute a user in a room
     * @param data - The restriction data for muting the user
     * @returns Promise<void>
     */
    const muteUser = async (data: RestrictionAction): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/mute",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
                addToast({
                    title: 'User muted successfully!',
                    color: 'success',
                });
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to mute user.'
                : 'Failed to mute user.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to mute user. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Kick a user from a room
     * @param data - The restriction data for kicking the user
     * @returns Promise<void>
     */
    const kickUser = async (data: RestrictionAction): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/kick",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
                addToast({
                    title: 'User kicked successfully!',
                    color: 'success',
                });
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to kick user.'
                : 'Failed to kick user.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to kick user. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Unban a user from a room
     * @param data - Object containing userId and roomId
     * @returns Promise<void>
     */
    const unbanUser = async (data: { userId: string; roomId: string }): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/unban",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
                addToast({
                    title: 'User unbanned successfully!',
                    color: 'success',
                });
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to unban user.'
                : 'Failed to unban user.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to unban user. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Unmute a user in a room
     * @param data - Object containing userId and roomId
     * @returns Promise<void>
     */
    const unmuteUser = async (data: { userId: string; roomId: string }): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{data: RestrictionAction}>(
                "/restriction/unmute",
                "POST",
                data
            );

            if (res.data?.data) {
                setRestriction(res.data.data);
                addToast({
                    title: 'User unmuted successfully!',
                    color: 'success',
                });
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to unmute user.'
                : 'Failed to unmute user.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to unmute user. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get restriction status for a user in a room
     * @param roomId - The room ID
     * @param userId - The user ID
     * @returns Promise<any | null>
     */
    const getRestrictionStatus = async (roomId: string, userId: string): Promise<any | null> => {
        try {
            const res = await apiGolangRequest<{data: any}>(
                `/restriction/status/${roomId}/${userId}`,
                "GET"
            );
            return res.data?.data || null;
        } catch (err) {
            console.error('Failed to get restriction status:', err);
            return null;
        }
    };

    /**
     * Get all restriction statuses in a room (optimized for large member lists)
     * @param roomId - The room ID
     * @returns Promise<Record<string, any>>
     */
    const getRoomRestrictions = async (roomId: string): Promise<Record<string, any>> => {
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

    /**
     * Get restriction history with filters
     * @param queryString - Query parameters for filtering
     * @returns Promise<any>
     */
    const getRestrictionHistory = async (queryString: string): Promise<any> => {
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
        restriction,
        error,
        banUser,
        muteUser,
        kickUser,
        unbanUser,
        unmuteUser,
        getRestrictionStatus,
        getRoomRestrictions,
        getRestrictionHistory,
    };
}

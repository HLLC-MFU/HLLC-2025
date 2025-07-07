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

    return {
        loading,
        banUser,
        muteUser,
        error,
        restriction,
    };
}

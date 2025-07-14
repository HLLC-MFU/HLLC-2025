import { useState, useCallback } from "react";
import { addToast } from "@heroui/react";

import { 
    RoomsByTypeResponse, 
    UseRoomsByTypeReturn 
} from "../types/room";

import { apiGolangRequest } from "@/utils/api";

export function useRoomsByType(): UseRoomsByTypeReturn {
    const [roomsByType, setRoomsByType] = useState<Record<string, RoomsByTypeResponse>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<Record<string, string | null>>({});

    const fetchRoomsByType = useCallback(async (
        roomType: string, 
        page: number = 1, 
        limit: number = 10
    ) => {
        setLoading(prev => ({ ...prev, [roomType]: true }));
        setError(prev => ({ ...prev, [roomType]: null }));

        try {
            const res = await apiGolangRequest<{ data: RoomsByTypeResponse }>(
                `/rooms/by-type?roomType=${roomType}&page=${page}&limit=${limit}`,
                "GET",
            );

            if (res.data?.data) {
                setRoomsByType(prev => ({
                    ...prev,
                    [roomType]: res.data!.data
                }));
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch rooms.'
                : 'Failed to fetch rooms.';

            setError(prev => ({ ...prev, [roomType]: errorMessage }));
            
            addToast({
                title: `Failed to fetch ${roomType} rooms. Please try again.`,
                color: 'danger',
            });
        } finally {
            setLoading(prev => ({ ...prev, [roomType]: false }));
        }
    }, []);

    const loadMoreRooms = useCallback(async (roomType: string) => {
        const currentData = roomsByType[roomType];
        if (!currentData) return;

        const nextPage = currentData.meta.page + 1;
        if (nextPage > currentData.meta.totalPages) return;

        setLoading(prev => ({ ...prev, [roomType]: true }));

        try {
            const res = await apiGolangRequest<{ data: RoomsByTypeResponse }>(
                `/rooms/by-type?roomType=${roomType}&page=${nextPage}&limit=${currentData.meta.limit}`,
                "GET",
            );

            if (res.data?.data) {
                setRoomsByType(prev => ({
                    ...prev,
                    [roomType]: {
                        data: [...currentData.data, ...res.data!.data.data],
                        meta: res.data!.data.meta
                    }
                }));
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to load more rooms.'
                : 'Failed to load more rooms.';

            setError(prev => ({ ...prev, [roomType]: errorMessage }));
            
            addToast({
                title: `Failed to load more ${roomType} rooms. Please try again.`,
                color: 'danger',
            });
        } finally {
            setLoading(prev => ({ ...prev, [roomType]: false }));
        }
    }, [roomsByType]);

    const refreshRooms = useCallback(async (roomType: string) => {
        await fetchRoomsByType(roomType, 1, 10);
    }, [fetchRoomsByType]);

    return {
        roomsByType,
        loading,
        error,
        fetchRoomsByType,
        loadMoreRooms,
        refreshRooms,
    };
} 
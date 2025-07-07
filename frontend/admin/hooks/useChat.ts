import { useState, useEffect } from "react";
import { Room, RoomMember } from "../types/chat";
import { apiGolangRequest, apiRequest } from "@/utils/api";
import { useGolangApi } from "./useApi";
import { addToast } from "@heroui/react";

export function useChat() {
    const [room, setRoom] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


        /**
         * Fetch all rooms from the API with pagination.
         * @param page - Page number (default: 1)
         * @param limit - Items per page (default: 10)
         * @return {Promise<void>} A promise that resolves when the rooms are fetched.
         * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
         */
        const fetchRoom = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiGolangRequest<{ data: Room[]}>(
                    `/rooms`,
                    "GET",
                );

                setRoom(Array.isArray(res.data?.data) ? res.data?.data : [])
            } catch (err) {
                addToast({
                    title: 'Failed to fetch rooms. Please try again.',
                    color: 'danger',
                });
                setError(
                    err && typeof err === 'object' && 'message' in err
                        ? (err as { message?: string }).message || 'Failed to fetch rooms.'
                        : 'Failed to fetch rooms.',
                );
            } finally {
                setLoading(false);
            }
        };

    /**
     * Create a new room with the provided data.
     * @param {FormData} roomData - The data to create the room with.
     * @return {Promise<ApiResponse<{ data: Room }>>} A promise that resolves when the room is created.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const createRoom = async (roomData: FormData) => {
        try {
            setLoading(true);

            const groupType = roomData.get('groupType');
            const endpoint = groupType ? "/rooms/group" : "/rooms";
            
            const res = await apiGolangRequest<Room>(endpoint, "POST", roomData);
            if (res.data) {
                setRoom(prev => [...prev, res.data as unknown as Room]);
            }
        } catch (err) {
            addToast({
                title: 'Failed to create room. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create room.'
                    : 'Failed to create room.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing room with the provided data.
     * @param {string} id - The ID of the room to update.
     * @param {FormData} roomData - The data to update the room with.
     * @return {Promise<ApiResponse<{ data: Room }>>} A promise that resolves when the room is updated.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const updateRoom = async (id: string, roomData: FormData) => {
        try {
            setLoading(true);
            const res = await apiGolangRequest<Room>(`/rooms/${id}`, "PATCH", roomData);
            if (res.data) {
                setRoom(prev => prev.map(room => room._id === id ? res.data as unknown as Room: room));
            }
        } catch (err) {
            addToast({
                title: 'Failed to update room. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update room.'
                    : 'Failed to update room.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete an existing room.
     * @param {string} id - The ID of the room to delete.
     * @return {Promise<ApiResponse<{ data: Room }>>} A promise that resolves when the room is deleted.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const deleteRoom = async (id: string) => {
        setLoading(true);
        try {
            const res = await apiGolangRequest<Room>(`/rooms/${id}`, "DELETE");
            if (res.data) {
                setRoom(prev => prev.filter(room => room._id !== id));
            }
        } catch (err) {
            addToast({
                title: 'Failed to delete room. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to delete room.'
                    : 'Failed to delete room.',
            );
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Get room by ID**
    const getRoomById = async (roomId: string) => {
        try {
            setLoading(true);
            
            const res = await apiGolangRequest<Room>(`/rooms/${roomId}`, "GET");
            
            if (res.data) {
                return res.data;
            }
        } catch (err) {
            addToast({
                title: 'Failed to fetch room. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch room.'
                    : 'Failed to fetch room.',
            );
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Get room members with pagination**
    const getRoomMembers = async (roomId: string) => {
        try {
            setLoading(true);
            
            const res = await apiGolangRequest<{ data: { members: RoomMember[] } }>(
                `/rooms/${roomId}/members`,
                "GET",
            );
            
            if (res.data) {
                return res.data;
            }
            
            return { data: { members: [] } };
        } catch (err) {
            addToast({
                title: 'Failed to fetch room members. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch room members.'
                    : 'Failed to fetch room members.',
            );
            return { data: { members: [] } };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch rooms by type (normal, readonly, school, major) with pagination
     */
    const fetchRoomByType = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{ data: Room[] }>(
                `/rooms?limit=0`,
                "GET",
            );
            setRoom(Array.isArray(res.data?.data) ? res.data?.data : [])
        } catch (err) {
            addToast({
                title: 'Failed to fetch rooms. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch rooms.'
                    : 'Failed to fetch rooms.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoom();
    }, []);

    return {
        room,
        loading,
        error,
        fetchRoom,
        createRoom,
        updateRoom,
        deleteRoom,
        getRoomById,
        getRoomMembers,
        fetchRoomByType,
    };
}
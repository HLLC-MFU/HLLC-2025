import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

import { 
    RoomByIdResponse, 
    RoomMembersResponse, 
    RoomMember, 
    RestrictionStatus, 
    RoomRestrictionsResponse,
    UseChatReturn 
} from "../types/room";

import { apiGolangRequest } from "@/utils/api";

export function useChat(): UseChatReturn {
    const [room, setRoom] = useState<RoomByIdResponse[]>([]);
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
                const res = await apiGolangRequest<{ data: RoomByIdResponse[]}>(
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
            
            const res = await apiGolangRequest<RoomByIdResponse>(endpoint, "POST", roomData);

            if (res.data) {
                setRoom(prev => [...prev, res.data as unknown as RoomByIdResponse]);
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
            const res = await apiGolangRequest<RoomByIdResponse>(`/rooms/${id}`, "PATCH", roomData);

            if (res.data) {
                setRoom(prev => prev.map(room => room._id === id ? res.data as unknown as RoomByIdResponse: room));
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
            const res = await apiGolangRequest<RoomByIdResponse>(`/rooms/${id}`, "DELETE");

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
    const getRoomById = async (roomId: string): Promise<RoomByIdResponse | undefined> => {
        try {
            setLoading(true);
            
            const res = await apiGolangRequest<{ data: RoomByIdResponse }>(`/rooms/${roomId}`, "GET");
            
            if (res.data) {
                return res.data.data || res.data;
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

    /**
     * Get restriction status for a user in a room
     * @param roomId - The room ID
     * @param userId - The user ID
     * @returns The restriction status
     */
    const getRestrictionStatus = async (roomId: string, userId: string): Promise<RestrictionStatus | null> => {
        try {
            const res = await apiGolangRequest<{data: RestrictionStatus}>(
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
     * Get room members with optional pagination query string and restriction status.
     * @param roomId - The room ID, optionally with query string (e.g., "abc123?page=1&limit=10")
     * @returns The API response with members and meta if available.
     */
    const getRoomMembers = async (roomId: string) => {
        try {
            setLoading(true);
            // Accept query string in roomId (e.g., "abc123?page=1&limit=10")
            const [id, query] = roomId.split("?");
            const endpoint = query ? `/rooms/${id}/members?${query}` : `/rooms/${id}/members`;
            const res = await apiGolangRequest<{ data: RoomMembersResponse }>(
                endpoint,
                "GET",
            );
            
            if (res.data) {
                // Handle nested data structure - the actual data is in res.data.data
                const responseData = res.data.data || res.data;
                const members = Array.isArray(responseData?.members)
                    ? responseData.members
                    : [];
                let roomRestrictions: RoomRestrictionsResponse = {};
                try {
                    const restrictionRes = await apiGolangRequest<{data: RoomRestrictionsResponse}>(
                        `/restriction/room/${id}/restrictions`,
                        "GET"
                    );
                    roomRestrictions = restrictionRes.data?.data || {};
                } catch (err) {
                    console.error('Failed to get room restrictions:', err);
                }

                // Map restriction status to each member
                const membersWithRestrictionStatus = members.map((member: RoomMember) => {
                    const memberRestrictions = roomRestrictions[member.user._id] || {
                        isBanned: false,
                        isMuted: false,
                        isKicked: false
                    };
                    
                    return {
                        ...member,
                        restrictionStatus: memberRestrictions
                    };
                });

                return {
                    data: {
                        members: membersWithRestrictionStatus,
                        meta: responseData.meta
                    }
                };
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
            const res = await apiGolangRequest<{ data: RoomByIdResponse[] }>(
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
        getRestrictionStatus,
        fetchRoomByType,
    };
}
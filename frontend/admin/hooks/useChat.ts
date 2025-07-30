import { useState, useEffect, useCallback } from "react";
import { addToast } from "@heroui/react";

import type { 
    Room, 
    RoomMembersResponse, 
    RoomMember, 
    RestrictionStatus, 
    RoomRestrictionsResponse,
    UseChatReturn
} from "../types/room";

import { apiGolangRequest } from "@/utils/api";

export function useChat(): UseChatReturn {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all rooms from the API
     * @returns Promise<void>
     */
    const fetchRooms = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<{ data: Room[]}>(
                `/rooms?limit=0`,
                "GET",
            );

            if (res.data?.data) {
                setRooms(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                setRooms([]);
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch rooms.'
                : 'Failed to fetch rooms.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to fetch rooms. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new room
     * @param roomData - FormData containing room information
     * @returns Promise<void>
     */
    const createRoom = async (roomData: FormData): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const groupType = roomData.get('groupType');
            const endpoint = groupType ? "/rooms/group" : "/rooms";
            
            const res = await apiGolangRequest<Room>(endpoint, "POST", roomData);

            if (res.data) {
                addToast({
                    title: 'Room created successfully!',
                    color: 'success',
                });
                
                // Refresh rooms list immediately
                await fetchRooms();
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to create room.'
                : 'Failed to create room.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to create room. Please try again.',
                color: 'danger',
            });
            throw err; // Re-throw to let component handle it
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing room
     * @param id - Room ID
     * @param roomData - FormData containing updated room information
     * @returns Promise<void>
     */
    const updateRoom = async (id: string, roomData: FormData): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<Room>(`/rooms/${id}`, "PATCH", roomData);

            if (res.data) {
                addToast({
                    title: 'Room updated successfully!',
                    color: 'success',
                });
                
                // Refresh rooms list immediately
                await fetchRooms();
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to update room.'
                : 'Failed to update room.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to update room. Please try again.',
                color: 'danger',
            });
            throw err; // Re-throw to let component handle it
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete a room
     * @param id - Room ID
     * @returns Promise<void>
     */
    const deleteRoom = async (id: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<Room>(`/rooms/${id}`, "DELETE");

            if (res.data) {
                addToast({
                    title: 'Room deleted successfully!',
                    color: 'success',
                });
                
                // Refresh rooms list immediately
                await fetchRooms();
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to delete room.'
                : 'Failed to delete room.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to delete room. Please try again.',
                color: 'danger',
            });
            throw err; // Re-throw to let component handle it
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle room status (active/inactive)
     * @param id - Room ID
     * @returns Promise<void>
     */
    const toggleRoomStatus = async (id: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGolangRequest<Room>(`/rooms/${id}/toggle-status`, "PATCH");

            if (res.data) {
                addToast({
                    title: 'Room status updated successfully!',
                    color: 'success',
                });
                
                // Refresh rooms list immediately
                await fetchRooms();
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to toggle room status.'
                : 'Failed to toggle room status.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to toggle room status. Please try again.',
                color: 'danger',
            });
            throw err; // Re-throw to let component handle it
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get room by ID
     * @param roomId - Room ID
     * @returns Promise<Room | undefined>
     */
    const getRoomById = async (roomId: string): Promise<Room | undefined> => {
        try {
            setLoading(true);
            
            const res = await apiGolangRequest<{ data: Room }>(`/rooms/${roomId}`, "GET");
            
            if (res.data) {
                return res.data.data || res.data;
            }
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch room.'
                : 'Failed to fetch room.';
            
            setError(errorMessage);
            addToast({
                title: 'Failed to fetch room. Please try again.',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
        return undefined;
    };

    /**
     * Get restriction status for a user in a room
     * @param roomId - Room ID
     * @param userId - User ID
     * @returns Promise<RestrictionStatus | null>
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
 * Get room members with restriction status
 * @param roomId - Room ID with optional query parameters
 * @returns Promise with members data
 */
const getRoomMembers = useCallback(async (roomId: string) => {
    try {
        setLoading(true);
        const [id, query] = roomId.split("?");
        
        // ตั้งค่า limit เป็น 0 ตลอดเวลา
        const endpoint = query 
            ? `/rooms/${id}/members?${query}&limit=10000`
            : `/rooms/${id}/members?limit=10000`;

        const res = await apiGolangRequest<{ data: RoomMembersResponse }>(
            endpoint,
            "GET",
        );
        
        if (res.data) {
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
        const errorMessage = err && typeof err === 'object' && 'message' in err
            ? (err as { message?: string }).message || 'Failed to fetch room members.'
            : 'Failed to fetch room members.';
        
        setError(errorMessage);
        addToast({
            title: 'Failed to fetch room members. Please try again.',
            color: 'danger',
        });
        return { data: { members: [] } };
    } finally {
        setLoading(false);
    }
}, []);


    useEffect(() => {
        fetchRooms();
    }, []);

    return {
        rooms,
        loading,
        error,
        fetchRooms,
        createRoom,
        updateRoom,
        deleteRoom,
        toggleRoomStatus,
        getRoomById,
        getRoomMembers,
        getRestrictionStatus,
    };
}
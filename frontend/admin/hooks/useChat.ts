"use client";

import { useState, useEffect } from "react";
import { 
    Room, 
    RoomMember, 
    EvoucherData, 
    EvoucherResponse, 
    RestrictionAction, 
    RestrictionResponse,
    RoomMembersResponse 
} from "../types/chat";
import { apiRequest, ApiResponse } from "../utils/api";

// Chat service API base URL
const CHAT_API_BASE_URL = "http://localhost:1334/api";

// Custom API request function for chat service
async function chatApiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: object | FormData,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(!isFormData && body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        };

        const response = await fetch(`${CHAT_API_BASE_URL}${endpoint}`, {
            method,
            headers,
            credentials: "include",
            body: body
                ? isFormData
                    ? (body as FormData)
                    : JSON.stringify(body)
                : undefined,
            ...options,
        });

        const responseData = await response.json();

        if (responseData.statusCode && responseData.message && responseData.data) {
            return {
                data: responseData.data,
                statusCode: responseData.statusCode,
                message: responseData.message,
            };
        } else if (response.ok) {
            return {
                data: responseData,
                statusCode: response.status,
                message: null,
            };
        }

        return {
            data: null,
            statusCode: response.status,
            message: responseData.message || "Request failed",
        };
    } catch (err) {
        console.error("Chat API Error:", err);
        return {
            data: null,
            statusCode: 500,
            message: (err as Error).message,
        };
    }
}

export function useChat() {
    const [room, setRoom] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all rooms from the API.
     * @return {Promise<void>} A promise that resolves when the rooms are fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const fetchRoom = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await chatApiRequest<{ data: Room[] }>("/rooms", "GET");

            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to fetch rooms`);
            }

            if (res.data && Array.isArray(res.data)) {
                setRoom(res.data);
            } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                setRoom(res.data.data);
            } else {
                setRoom([]);
            }
        } catch (err) {
            console.error("Fetch rooms error:", err);
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
    const createRoom = async (roomData: FormData): Promise<ApiResponse<{ data: Room }>> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<{ data: Room }>("/rooms", "POST", roomData);
            const newRoom = res.data?.data;
            if (newRoom) {
                setRoom(prev => [...prev, newRoom]);
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create room.';
            setError(errorMessage);
            throw new Error(errorMessage);
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
    const updateRoom = async (id: string, roomData: FormData): Promise<ApiResponse<{ data: Room }>> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<{ data: Room }>(`/rooms/${id}`, "PATCH", roomData);
            const updatedRoom = res.data?.data;
            if (updatedRoom) {
                setRoom(prev => 
                    prev.map(room => 
                        room._id === id ? updatedRoom : room
                    )
                );
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update room.';
            setError(errorMessage);
            throw new Error(errorMessage);
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
    const deleteRoom = async (id: string): Promise<ApiResponse<{ data: Room }>> => {
        setLoading(true);
        try {
            const res = await chatApiRequest<{ data: Room }>(`/rooms/${id}`, "DELETE");
            const deletedRoom = res.data?.data;
            if (deletedRoom) {
                setRoom(prev => prev.filter(room => room._id !== id));
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete room.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Get room members**
    const getRoomMembers = async (roomId: string): Promise<RoomMember[]> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RoomMembersResponse>(`/rooms/${roomId}/members`, "GET");
            
            if (res.statusCode !== 200) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to fetch room members`);
            }

            if (res.data?.data?.members) {
                return res.data.data.members.map(member => ({
                    _id: member.user._id,
                    username: member.user.username,
                    name: member.user.name,
                    role: member.user.role || { _id: '', name: 'User' },
                    joinedAt: new Date().toISOString(), // This would come from the API
                    isOnline: false, // This would come from WebSocket status
                    lastSeen: new Date().toISOString(), // This would come from the API
                }));
            }
            
            return [];
        } catch (err) {
            console.error("Fetch room members error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to fetch room members.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Send evoucher**
    const sendEvoucher = async (evoucherData: EvoucherData): Promise<EvoucherResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<EvoucherResponse>("/evouchers/send", "POST", evoucherData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to send evoucher`);
            }

            return res.data as EvoucherResponse;
        } catch (err) {
            console.error("Send evoucher error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to send evoucher.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Ban user**
    const banUser = async (restrictionData: RestrictionAction): Promise<RestrictionResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RestrictionResponse>("/restrictions/ban", "POST", restrictionData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to ban user`);
            }

            return res.data as RestrictionResponse;
        } catch (err) {
            console.error("Ban user error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to ban user.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Mute user**
    const muteUser = async (restrictionData: RestrictionAction): Promise<RestrictionResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RestrictionResponse>("/restrictions/mute", "POST", restrictionData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to mute user`);
            }

            return res.data as RestrictionResponse;
        } catch (err) {
            console.error("Mute user error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to mute user.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Kick user**
    const kickUser = async (restrictionData: RestrictionAction): Promise<RestrictionResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RestrictionResponse>("/restrictions/kick", "POST", restrictionData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to kick user`);
            }

            return res.data as RestrictionResponse;
        } catch (err) {
            console.error("Kick user error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to kick user.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Unban user**
    const unbanUser = async (restrictionData: RestrictionAction): Promise<RestrictionResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RestrictionResponse>("/restrictions/unban", "POST", restrictionData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to unban user`);
            }

            return res.data as RestrictionResponse;
        } catch (err) {
            console.error("Unban user error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to unban user.');
        } finally {
            setLoading(false);
        }
    };

    // **NEW: Unmute user**
    const unmuteUser = async (restrictionData: RestrictionAction): Promise<RestrictionResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<RestrictionResponse>("/restrictions/unmute", "POST", restrictionData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to unmute user`);
            }

            return res.data as RestrictionResponse;
        } catch (err) {
            console.error("Unmute user error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to unmute user.');
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
        // **NEW: Room management functions**
        getRoomMembers,
        sendEvoucher,
        banUser,
        muteUser,
        kickUser,
        unbanUser,
        unmuteUser,
    };
}
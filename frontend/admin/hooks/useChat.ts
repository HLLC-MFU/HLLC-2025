"use client";

import { useState, useEffect } from "react";
import { 
    Room, 
    RoomMember, 
    RoomMembersResponse 
} from "../types/chat";
import { getToken } from "../utils/storage";

// Chat service API base URL
const CHAT_API_BASE_URL = process.env.GO_PUBLIC_API_URL || "http://localhost:1334/api";

// Custom API request function for chat service using useApi
export async function chatApiRequest<T>(
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
        
        const response = await fetch(`${CHAT_API_BASE_URL}${endpoint}`, {
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
            message: null,
        };
    } catch (error) {
        console.error("Chat API request error:", error);
        return {
            data: null,
            statusCode: 500,
            message: error instanceof Error ? error.message : "Network error",
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
    const createRoom = async (roomData: FormData): Promise<{ data: { data: Room } | null; statusCode: number; message: string | null }> => {
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
    const updateRoom = async (id: string, roomData: FormData): Promise<{ data: { data: Room } | null; statusCode: number; message: string | null }> => {
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
    const deleteRoom = async (id: string): Promise<{ data: { data: Room } | null; statusCode: number; message: string | null }> => {
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

            // Check for members in the correct path based on API response structure
            const members = res.data?.members || res.data?.data?.members;
            
            if (members && Array.isArray(members)) {
                const processedMembers = members.map(member => ({
                    _id: member.user._id,
                    username: member.user.username,
                    name: typeof member.user.name === 'string' 
                        ? { first: member.user.name, last: '' }
                        : member.user.name || { first: member.user.username, last: '' },
                    role: member.user.role || { _id: '', name: 'User' },
                    joinedAt: new Date().toISOString(), // This would come from the API
                    isOnline: false, // This would come from WebSocket status
                    lastSeen: new Date().toISOString(), // This would come from the API
                }));
                return processedMembers;
            }
            
            return [];
        } catch (err) {
            console.error("Fetch room members error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to fetch room members.');
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
        getRoomMembers,
    };
}
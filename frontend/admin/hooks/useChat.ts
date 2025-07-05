"use client";

import { useState, useEffect } from "react";
import { Room } from "../types/chat";
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
        // Get token from localStorage (more reliable than cookies in client-side)
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(!isFormData && body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        };

        console.log("Chat API Request:", {
            url: `${CHAT_API_BASE_URL}${endpoint}`,
            method,
            headers,
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });

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

        console.log("Chat API Response:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });

        const responseData = await response.json();
        console.log("Chat API Response Data:", responseData);

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
	 * Fetch all room from the API.
	 * This function retrieves the list of room and updates the state.
	 * limit=0 is used to fetch all room without pagination.
	 * @return {Promise<void>} A promise that resolves when the room are fetched.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
    const fetchRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching rooms...");
            const res = await chatApiRequest<{ data: Room[] }>(
                "/rooms",
                "GET",
            );

            console.log("Fetch rooms response:", res);

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
                    ? (err as { message?: string }).message || 'Failed to fetch room.'
                    : 'Failed to fetch room.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
	 * Create a new room with the provided data.
	 * This function sends a POST request to the API to create a new room.
	 * @param {FormData} roomData - The data to create the room with formdata.
	 * @return {Promise<void>} A promise that resolves when the room is created.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
    const createRoom = async (roomData: FormData) => {
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
	 * This function sends a PATCH request to the API to update the room.
	 * @param {string} id - The ID of the room to update.
	 * @param {FormData} roomData - The data to update the room with formdata.
	 * @return {Promise<void>} A promise that resolves when the room is updated.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
    const updateRoom = async (id: string, roomData: FormData) => {
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
	 * Delete an existing room with the provided data.
	 * This function sends a DELETE request to the API to delete the room.
	 * @param {string} id - The ID of the room to delete.
	 * @return {Promise<void>} A promise that resolves when the room is deleted.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
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
    }

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
    }
}
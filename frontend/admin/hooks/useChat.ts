import { useEffect, useState } from "react";
import { Room } from "@/types/chat";
import { apiRequest, ApiResponse } from "@/utils/api";
import { addToast } from "@heroui/react";

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
            const res = await apiRequest<{ data: Room[] }>(
                "/rooms?limit=0",
                "GET",
            );

            setRoom(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
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
            const res = await apiRequest<{ data: Room }>("/rooms", "POST", roomData);
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
            const res = await apiRequest<{ data: Room }>(`/rooms/${id}`, "PATCH", roomData);
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
            const res = await apiRequest<{ data: Room }>(`/rooms/${id}`, "DELETE");
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
import { useState } from "react";
import { Chat } from "@/types/chat";
import { apiRequest } from "@/utils/api";

export function useChat() {
    const [chat, setChat] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChat = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Chat[] }>("/chat", "GET");
            setChat(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch chat");
        } finally {
            setLoading(false);
        }
    }
}
import { useState, useEffect } from "react"
import { Student , Notification} from "@/types/student"
import { apiRequest } from "@/utils/api"

export function useNotification() {
    const [notification, setNotification] = useState<Notification[]>([])
    const [student, setStudent] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 📥 Fetch all Student
    const fetchStudent = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Student[] }>("/schools?limit=0", "GET");
            setStudent(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch schools.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create new Notification
    const createNotification = async (NotificationData: Partial<Notification>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Notification>("/schools", "POST", schoolData);
            console.log("Create response:", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setSchools((prev) => {
                        const updated = [...prev, res.data as School];
                        resolve(updated);
                        return updated;
                    });
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create school.");
        } finally {
            setLoading(false);
        }
    };

}
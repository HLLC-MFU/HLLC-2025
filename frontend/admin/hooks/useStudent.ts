import { useEffect, useState } from 'react';
import { apiRequest } from "@/utils/api";
import { Student } from '../types/student'; // Adjust the import path as necessary

export function useStudent() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all students
    const fetchStudents = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await apiRequest<{ data: Student[] }>("/students?limit=0", "GET");
            setStudents(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch students.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    return { students, loading, error, fetchStudents };
}
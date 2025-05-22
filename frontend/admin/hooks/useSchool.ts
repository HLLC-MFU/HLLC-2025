import { useState, useEffect } from "react";
import { School } from "@/types/school";
import { apiRequest } from "@/utils/api";

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 Fetch all schools
  const fetchSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: School[] }>("/schools", "GET");
      setSchools(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch schools.");
    } finally {
      setLoading(false);
    }
  };

  // ➕ Create new school
  const createSchool = async (schoolData: Partial<School>) => {
    try {
      setLoading(true);
      const res = await apiRequest<School>("/schools", "POST", schoolData);
      if (res.data) {
        setSchools((prev) => [...prev, res.data as School]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create school.");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Update school
  const updateSchool = async (id: string, schoolData: Partial<School>) => {
    try {
      setLoading(true);
      const res = await apiRequest<School>(`/schools/${id}`, "PATCH", schoolData);
      if (res.data) {
        setSchools((prev) =>
          prev.map((s) => (s._id === id ? res.data! : s))
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to update school.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete school
  const deleteSchool = async (id: string) => {
    try {
      setLoading(true);
      await apiRequest(`/schools/${id}`, "DELETE");
      setSchools((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete school.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  return {
    schools,
    loading,
    error,
    fetchSchools,
    createSchool,
    updateSchool,
    deleteSchool,
  };
}

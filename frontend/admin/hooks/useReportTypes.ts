// useCategories.ts
import { useState, useEffect } from "react";
import type { ReportTypes } from "@/types/report";

export function useReportTypes() {
  const [reporttypes, setReportTypes] = useState<ReportTypes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/report-types");
      const data = await res.json();
      const processed = data.data.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        createdAt: new Date(cat.createdAt ?? Date.now()),
        updatedAt: new Date(cat.updatedAt ?? Date.now()),
        description: { en: "", th: "" },
        color: "", 
      }));
      setReportTypes(processed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addReportTypes = async (payload: Partial<ReportTypes>) => {
    const res = await fetch("http://localhost:8080/api/report-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await res.json();
    await fetchReportTypes();
    return saved;
  };

  const updateReportTypes = async (id: string, payload: Partial<ReportTypes>) => {
    const res = await fetch(`http://localhost:8080/api/report-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    await fetchReportTypes();
    return updated;
  };

  const deleteReportTypes = async (id: string) => {
    await fetch(`http://localhost:8080/api/report-types/${id}`, {
      method: "DELETE",
    });
    setReportTypes(reporttypes.filter(c => c.id !== id));
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return {
    reporttypes,
    loading,
    error,
    fetchReportTypes,
    addReportTypes,
    updateReportTypes,
    deleteReportTypes,
  };
}

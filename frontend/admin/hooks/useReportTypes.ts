'use client';

import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

import { ReportTypes } from "@/types/report";
import { apiRequest } from "@/utils/api";

export function useReportTypes() {
  const [reporttypes, setReportTypes] = useState<ReportTypes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{
        data: {
          _id: string;
          name: { en: string; th: string };
          createdAt?: string;
          updatedAt?: string;
          description?: { en: string; th: string };
          color?: string;
        }[];
      }>("/report-types", "GET");

      const processed: ReportTypes[] = res.data?.data.map(cat => ({
        id: cat._id,
        name: cat.name,
        createdAt: new Date(cat.createdAt ?? Date.now()),
        updatedAt: new Date(cat.updatedAt ?? Date.now()),
        description: cat.description ?? { en: "", th: "" },
        color: cat.color ?? "",
      })) ?? [];

      setReportTypes(processed);
    } catch (err: any) {
      setError(err.message || "Failed to fetch report types.");
      addToast({ title: "Failed to fetch report types.", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const addReportTypes = async (payload: Partial<ReportTypes>) => {
    try {
      setLoading(true);
      const res = await apiRequest<{ data: { _id: string } }>("/report-types", "POST", payload);

      if (res.data) {
        await fetchReportTypes();
        addToast({ title: "Category added!", color: "success" });

        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to add category.");
      addToast({ title: "Add failed", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const updateReportTypes = async (id: string, payload: Partial<ReportTypes>) => {
    try {
      setLoading(true);
      const res = await apiRequest<{ data: { _id: string } }>(`/report-types/${id}`, "PATCH", payload);

      if (res.data) {
        await fetchReportTypes();
        addToast({ title: "Category updated!", color: "success" });

        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to update category.");
      addToast({ title: "Update failed", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const deleteReportTypes = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/report-types/${id}`, "DELETE");

      if (res.statusCode === 200) {
        setReportTypes(prev => prev.filter(r => r.id !== id));
        addToast({ title: "Category deleted!", color: "success" });
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete category.");
      addToast({ title: "Delete failed", color: "danger" });
    } finally {
      setLoading(false);
    }
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

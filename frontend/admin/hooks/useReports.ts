import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";
import { Problem } from "@/types/report";
import { useReportTypes } from "@/hooks/useReportTypes";
import { apiRequest } from "@/utils/api";

export function useReports() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reporttypes, loading: loadingCategories } = useReportTypes();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        data: {
          _id: string;
          message: string;
          status?: string;
          createdAt?: string;
          updatedAt?: string;
          category?: { _id: string };
        }[];
      }>("/reports", "GET");

      const data = (res.data?.data || []).map((r): Problem => ({
        id: r._id,
        categoryId: r.category?._id ?? "",
        createdAt: new Date(r.createdAt ?? Date.now()),
        updatedAt: new Date(r.updatedAt ?? Date.now()),
        title: { en: r.message, th: r.message },
        description: { en: "", th: "" },
        status: (r.status as Problem["status"]) ?? "Pending",
      }));

      setProblems(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch reports");
      addToast({ title: "Failed to fetch reports", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Problem["status"]) => {
    setLoading(true);
    try {
      await apiRequest(`/reports/${id}`, "PATCH", { status });
      setProblems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status, updatedAt: new Date() } : p
        )
      );
      addToast({ title: "Status updated", color: "success" });
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
      addToast({ title: "Update failed", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const addOrEditProblem = (problem: Problem) => {
    setProblems((prev) =>
      prev.some((p) => p.id === problem.id)
        ? prev.map((p) => (p.id === problem.id ? problem : p))
        : [...prev, problem]
    );
  };

  const removeByCategory = (categoryId: string) => {
    setProblems((prev) => prev.filter((p) => p.categoryId !== categoryId));
  };

  useEffect(() => {
    if (!loadingCategories) fetchReports();
  }, [loadingCategories]);

  return {
    problems,
    loading: loading || loadingCategories,
    error,
    fetchReports,
    updateStatus,
    addOrEditProblem,
    removeByCategory,
  };
}

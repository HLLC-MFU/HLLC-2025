// hooks/useReports.ts
import { useState, useEffect } from "react";
import type { Problem } from "@/types/report";

export function useReports() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/reports");
      const data = await res.json();
      const processed = data.data.map((report: any) => ({
        ...report,
        id: report._id,
        categoryId: report.category?._id ?? '',
        createdAt: new Date(report.createdAt ?? Date.now()),
        updatedAt: new Date(report.updatedAt ?? Date.now()),
        title: {
          en: report.message,
          th: report.message,
        },
        description: {
          en: '',
          th: '',
        },
        severity: 'medium',
        status: report.status ?? 'Pending',
      }));
      setProblems(processed);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Problem["status"]) => {
    await fetch(`http://localhost:8080/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    setProblems(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status: newStatus, updatedAt: new Date() } : p
      )
    );
  };

  const addOrEditProblem = (problem: Problem) => {
    setProblems(prev =>
      prev.some(p => p.id === problem.id)
        ? prev.map(p => (p.id === problem.id ? problem : p))
        : [...prev, problem]
    );
  };

  const removeByCategory = (categoryId: string) => {
    setProblems(prev => prev.filter(p => p.categoryId !== categoryId));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    problems,
    loading,
    updateStatus,
    addOrEditProblem,
    removeByCategory,
  };
}

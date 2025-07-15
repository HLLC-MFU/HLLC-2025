'use client';

import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";
import { apiRequest } from "@/utils/api";
import { ReportTypes } from "@/types/report";
import { useProfile } from "./useProfile";

interface SubmitReportPayload {
  category: string;
  message: string;
}

export function useReport() {
  const { user } = useProfile();

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
      addToast({ title: "Topic loading failed.", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (payload: SubmitReportPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (!user?._id) {
        throw new Error("User information not found");
      }

      const reportData = {
        reporter: user._id,
        category: payload.category,
        message: payload.message,
        status: "pending",
      };

      const res = await apiRequest("/reports", "POST", reportData);

      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        addToast({ title: "Report submitted successfully", color: "success" });
        return true;
      } else {
        throw new Error(res.message || "Failed to submit report");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to submit report";
      setError(msg);
      addToast({ title: msg, color: "danger" });
      return false;
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
    submitReport,
  };
}
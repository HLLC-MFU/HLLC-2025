import { useState } from "react";
import { getToken } from "@/utils/storage";

interface ReportType {
  _id: string;
  name: {
    th: string;
    en: string;
  };
}

interface UseReportReturn {
  topics: ReportType[];
  loading: boolean;
  error: string | null;
  fetching: boolean;
  fetchReportTypes: () => Promise<void>;
  submitReport: (category: string, message: string) => Promise<boolean>;
}

export function useReport(): UseReportReturn {
  const [topics, setTopics] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);

  const fetchReportTypes = async (): Promise<void> => {
    setFetching(true);
    setError(null);

    try {
      const token = await getToken("accessToken");
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/report-types`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const response = await res.json();
        const data = response.data || [];
        setTopics(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลหัวข้อรายงานได้');
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const submitReport = async (category: string, message: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken("accessToken");
      
      // Get user profile to get user ID
      const profileRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!profileRes.ok) {
        setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
        return false;
      }
      
      const profileData = await profileRes.json();
      
      if (!profileData.data?.[0]?._id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        return false;
      }
      
      // Submit report
      const reportData = {
        reporter: profileData.data[0]._id,
        category,
        message,
        status: 'pending'
      };
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reports`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        setError(null);
        return true;
      } else {
        const errorData = await res.json();
        setError(errorData?.message || 'ส่งรายงานไม่สำเร็จ');
        return false;
      }
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    topics,
    loading,
    error,
    fetching,
    fetchReportTypes,
    submitReport,
  };
} 
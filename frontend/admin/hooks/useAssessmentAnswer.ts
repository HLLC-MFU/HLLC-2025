import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';

import { apiRequest } from '@/utils/api';

export interface AssessmentAverage {
  assessment: {
    _id: string;
    question: { th: string; en: string };
    type: string;
    activity: string;
    order: number;
    createdAt: string;
    updatedAt: string;
  };
  average: number;
  count: number;
}

export function useAssessmentAverages(activityId?: string) {
  const [data, setData] = useState<AssessmentAverage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all assessment averages or by activity.
   * @returns {Promise<void>}
   */
  const fetchAverages = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = activityId
        ? `/assessment-answers/${activityId}/average`
        : `/assessment-answers/all/average`;

      const res = await apiRequest<AssessmentAverage[]>(endpoint, 'GET');
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch assessments'
          : 'Failed to fetch assessments';

      setError(message);

      addToast({
        title: 'ไม่สามารถโหลดข้อมูลแบบประเมินได้',
        description: message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAverages();
  }, [activityId]);

  return {
    data,
    loading,
    error,
    refetch: fetchAverages,
  };
}

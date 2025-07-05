import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';

export interface StepAchievement {
  _id: string;
  // เพิ่ม field อื่น ๆ ตาม schema ที่ backend ส่งมา ถ้าต้องการ
}

const useStepAchievement = () => {
  const [achievements, setAchievements] = useState<StepAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ data: StepAchievement[] }>('/step-achievement', 'GET');
        setAchievements(res.data?.data || []);
      } catch (err) {
        setError('Failed to fetch achievements');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  return { achievements, loading, error };
};

export default useStepAchievement; 
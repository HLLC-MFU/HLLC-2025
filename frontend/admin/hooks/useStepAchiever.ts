import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { StepAchievement } from '@/types/step-counters';
import { addToast } from '@heroui/react';

export function useStepAchievement() {
  const [achievement, setAchievement] = useState<StepAchievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeAchievement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: StepAchievement[] }>(
        '/step-achievements',
        'GET'
      );

      const allAchievements = res.data?.data ?? [];

      if (allAchievements.length > 0) {
        // 🔥 sort ให้แน่ใจว่าใช้ตัวแรกสุดที่สร้าง (createdAt)
        const sorted = allAchievements.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setAchievement(sorted[0]);
      } else {
        // ✅ ถ้าไม่มี สร้างใหม่
        const newRes = await apiRequest<StepAchievement>(
          '/step-achievements',
          'POST',
          { achievement: 0 }
        );
        setAchievement(newRes.data);
        addToast({ title: 'Step goal initialized', color: 'success' });
      }
    } catch (err) {
      setError('Failed to initialize step achievement');
      addToast({ title: 'Init failed', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const updateAchievement = async (newValue: number) => {
    if (!achievement) return;

    try {
      const res = await apiRequest<StepAchievement>(
        `/step-achievements/${achievement._id}`, // ✅ ใช้ ID ของตัวที่โหลดไว้
        'PATCH',
        { achievement: newValue }
      );
      setAchievement(res.data);
      addToast({ title: 'Step goal updated', color: 'success' });
    } catch (err) {
      addToast({ title: 'Update failed', color: 'danger' });
    }
  };

  useEffect(() => {
    initializeAchievement();
  }, []);

  return {
    achievement,
    loading,
    error,
    updateAchievement,
  };
}

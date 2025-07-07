// hooks/useStepAchievement.ts
import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { StepAchievement } from '@/types/step-counters'; // ปรับ path ตามจริง
import { addToast } from '@heroui/react';

export function useStepAchievement() {
    const [achievements, setAchievements] = useState<StepAchievement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAchievements = async (params: Record<string, string> = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: StepAchievement[] }>(
                `/step-achievements`, // route ต้องตรงกับ controller ของคุณ
                'GET',
                params
            );
            if (res.data && Array.isArray(res.data.data)) {
                setAchievements(res.data.data);
            } else {
                setAchievements([]);
                addToast({ 
                    title: 'No data returned.', 
                    color: 'warning' 
                });
            }

        } catch (err) {
            setError('Failed to fetch achievements.');
            addToast({ title: 'Fetch failed', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const createAchievement = async (dto: Partial<StepAchievement>) => {
        try {
            const res = await apiRequest<StepAchievement>(
                `/step-achievements`,
                'POST',
                dto
            );
            await fetchAchievements();
            addToast({ title: 'Achievement created', color: 'success' });
            return res.data;
        } catch (err) {
            addToast({ title: 'Create failed', color: 'danger' });
            throw err;
        }
    };

    const updateAchievement = async (id: string, dto: Partial<StepAchievement>) => {
        try {
            const res = await apiRequest<StepAchievement>(
                `/step-achievements/${id}`,
                'PATCH',
                dto
            );
            await fetchAchievements();
            addToast({ title: 'Achievement updated', color: 'success' });
            return res.data;
        } catch (err) {
            addToast({ title: 'Update failed', color: 'danger' });
            throw err;
        }
    };

    const deleteAchievement = async (id: string) => {
        try {
            await apiRequest(`/step-achievements/${id}`, 'DELETE');
            await fetchAchievements();
            addToast({ title: 'Achievement deleted', color: 'success' });
        } catch (err) {
            addToast({ title: 'Delete failed', color: 'danger' });
            throw err;
        }
    };

    return {
        achievements,
        loading,
        error,
        fetchAchievements,
        createAchievement,
        updateAchievement,
        deleteAchievement,
    };
}

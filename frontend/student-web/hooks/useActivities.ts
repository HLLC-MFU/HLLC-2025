import { useState, useEffect } from 'react';

import { apiRequest } from '@/utils/api';
import { Assessment } from '@/types/assessment';
import { AssessmentAnswer } from '@/types/assessmentAnswer';
import { useSseStore } from '@/stores/useSseStore';

export function useActivities(activityId: string | null) {
  const activities = useSseStore(state => state.activities);
  const fetchActivitiesByUser = useSseStore(
    state => state.fetchActivitiesByUser,
  );
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    AssessmentAnswer[]
  >([]);
  const [answers, setAnswers] = useState<
    { assessment: string; answer: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchUserProgress = useSseStore(state => state.fetchUserProgress);

  const fetchAssessmentByActivity = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: Assessment[] }>(
        `/activities/${id}/assessment`,
        'GET',
      );
      const fetched = Array.isArray(res.data?.data) ? res.data.data : [];

      setAssessments(fetched);
      const initialAnswers = fetched.map(a => ({
        assessment: a._id,
        answer: '',
      }));

      setAnswers(initialAnswers);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch assessments by activity.'
          : 'Failed to fetch assessments by activity.',
      );
    } finally {
      setLoading(false);
    }
  };

  const createAssessmentAnswers = async (
    answerData: Partial<AssessmentAnswer>,
  ) => {
    try {
      setLoading(true);
      const res = await apiRequest<AssessmentAnswer>(
        '/assessment-answers',
        'POST',
        answerData,
      );

      if (res.data) {
        await new Promise(resolve => {
          setAssessmentAnswers(prev => {
            const updated = [...prev, res.data as AssessmentAnswer];

            resolve(updated);
            fetchUserProgress();
            return updated;
          });
        });
      }

      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to create answers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivitiesByUser();
  }, []);

  useEffect(() => {
    if (activityId) {
      fetchAssessmentByActivity(activityId);
    }
  }, [activityId]);

  return {
    activities,
    assessments,
    assessmentAnswers,
    answers,
    setAnswers,
    loading,
    error,
    fetchActivitiesByUser,
    fetchAssessmentByActivity,
    createAssessmentAnswers,
  };
}

import { useState, useEffect } from 'react';

import { useSSE } from './useSSE';

import { apiRequest } from '@/utils/api';
import { Activities } from '@/types/activities';
import { Assessment } from '@/types/assessment';
import { AssessmentAnswer } from '@/types/assessmentAnswer';

export function useActivities(activityId: string | null) {
  const [activities, setActivities] = useState<Activities[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    AssessmentAnswer[]
  >([]);
  const [answers, setAnswers] = useState<
    { assessment: string; answer: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivitiesByUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: Activities[] }>(
        '/activities/user',
        'GET',
      );

      setActivities(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
          'Failed to fetch activities by user.'
          : 'Failed to fetch activities by user.',
      );
    } finally {
      setLoading(false);
    }
  };

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

  useSSE(payload => {
    if (payload.type === 'REFETCH_DATA') {
      switch (payload.path) {
        case '/activities/user':
          fetchActivitiesByUser();
          break;
        default:
          break;
      }
    } else {
      return;
    }
  });

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

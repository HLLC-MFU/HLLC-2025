import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { useToastController } from '@tamagui/toast';
import { useTranslation } from 'react-i18next';

export type PrePostType = 'pretest' | 'posttest';

interface UsePrePostModalOptions {
  type: PrePostType;
  progress?: number;
}

export default function usePrePostModal({ type, progress }: UsePrePostModalOptions) {
  const { t } = useTranslation();
  const toast = useToastController();

  const [isDone, setIsDone] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [posttestDueDate, setPosttestDueDate] = useState<boolean>(false);
  const [hasPretestQuestions, setHasPretestQuestions] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'pretest') {
        const res = await apiRequest<{ data: boolean }>('/pretest-answers/user', 'GET');
        setIsDone(res.data?.data ?? false);
        setModalVisible(!(res.data?.data ?? false));
      } else {
        const res = await apiRequest<{ data: boolean; dueDate: boolean }>('/posttest-answers/user', 'GET');
        setIsDone(res.data?.data ?? false);
        setPosttestDueDate(res.data?.dueDate ?? false);
        setModalVisible(false); // wait for further check
      }
    } catch (err) {
      setIsDone(false);
      setError(type === 'pretest' ? 'ไม่สามารถเช็คสถานะ pretest ได้' : 'ไม่สามารถเช็คสถานะ posttest ได้');
      if (type === 'posttest') setPosttestDueDate(false);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: any[] }>('/prepost-questions?page=1&limit=30', 'GET');
      const allQuestions = Array.isArray(res.data?.data) ? res.data.data : [];
      const filteredQuestions = allQuestions.filter(q => q.displayType === type);
      setQuestions(filteredQuestions);

      if (type === 'pretest') {
        const hasQuestion = filteredQuestions.length > 0;
        setHasPretestQuestions(hasQuestion);
        setModalVisible(hasQuestion);
      }

      if (type === 'posttest') {
        setModalVisible(false); // will be evaluated in separate useEffect
      }

    } catch (err) {
      setQuestions([]);
      setError(type === 'pretest' ? 'ไม่สามารถโหลดคำถาม pretest ได้' : 'ไม่สามารถโหลดคำถาม posttest ได้');
    } finally {
      setLoading(false);
    }
  }, [type]);

  const submit = useCallback(async (answerData: any = {}) => {
    setLoading(true);
    const answersArray = Object.entries(answerData).map(([id, answer]) => ({
      [type]: id,
      answer,
    }));
    const payload = { answers: answersArray };

    try {
      const url = type === 'pretest' ? '/pretest-answers' : '/posttest-answers';
      await apiRequest(url, 'POST', payload);
      setIsDone(true);
      setModalVisible(false);
      toast.show(t(`${type}.successTitle`), {
        message: t(`${type}.successMessage`),
        type: 'success',
      });
    } catch (err) {
      setError(type === 'pretest' ? 'ส่งคำตอบ pretest ไม่สำเร็จ' : 'ส่งคำตอบ posttest ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [t, toast, type]);

  useEffect(() => {
    if (isDone) return;
    fetchStatus();
    fetchQuestions();
  }, [isDone, fetchStatus, fetchQuestions, type]);

  useEffect(() => {
    if (
      type === 'posttest' &&
      posttestDueDate &&
      (progress ?? 0) >= 80 &&
      isDone === false &&
      hasPretestQuestions
    ) {
      setModalVisible(true);
    }
  }, [type, posttestDueDate, progress, isDone, hasPretestQuestions]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  return {
    isDone,
    modalVisible,
    loading,
    error,
    questions,
    submit,
    openModal,
    closeModal,
    fetchStatus,
    fetchQuestions,
    posttestDueDate,
    progress,
  };
}

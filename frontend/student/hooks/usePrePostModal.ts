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

  const [isPretestDone, setIsPretestDone] = useState<boolean | null>(null);
  const [isPosttestDone, setIsPosttestDone] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [posttestDueDate, setPosttestDueDate] = useState<boolean>(false);
  const [hasPretestQuestions, setHasPretestQuestions] = useState<boolean>(true);

  // ใช้ setIsPretestDone/setIsPosttestDone ตรง ๆ

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'pretest') {
        const res = await apiRequest<{ data: boolean }>('/pretest-answers/user', 'GET');
        setIsPretestDone(res.data?.data ?? false);
        setModalVisible(!(res.data?.data ?? false));
      } else {
        const res = await apiRequest<{ data: boolean; dueDate: boolean }>('/posttest-answers/user', 'GET');
        setIsPosttestDone(res.data?.data ?? false);
        setPosttestDueDate(res.data?.dueDate ?? false);
        setModalVisible(false); // wait for further check
      }
    } catch (err) {
      if (type === 'pretest') {
        if (isPretestDone !== true) setIsPretestDone(false);
      } else {
        if (isPosttestDone !== true) setIsPosttestDone(false);
      }
      setError(type === 'pretest' ? 'ไม่สามารถเช็คสถานะ pretest ได้' : 'ไม่สามารถเช็คสถานะ posttest ได้');
      if (type === 'posttest') setPosttestDueDate(false);
    } finally {
      setLoading(false);
    }
  }, [type, isPretestDone, isPosttestDone]);

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
        // ป้องกัน setModalVisible ถ้า isPretestDone ไม่ได้เป็น false
        if (isPretestDone === false && hasQuestion) setModalVisible(true);
      }

      if (type === 'posttest') {
        // สำหรับ posttest ต้องตรวจสอบว่ามี pretest questions หรือไม่
        const pretestQuestions = allQuestions.filter(q => q.displayType === 'pretest');
        const hasPretestQuestion = pretestQuestions.length > 0;
        setHasPretestQuestions(hasPretestQuestion);
        setModalVisible(false); 
      }

    } catch (err) {
      setQuestions([]);
      setError(type === 'pretest' ? 'ไม่สามารถโหลดคำถาม pretest ได้' : 'ไม่สามารถโหลดคำถาม posttest ได้');
    } finally {
      setLoading(false);
    }
  }, [type, isPretestDone]);

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
      if (type === 'pretest') {
        setIsPretestDone(true);
      } else {
        setIsPosttestDone(true);
      }
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
    fetchStatus();
    fetchQuestions();
  }, [type]);

  useEffect(() => {
    if (
      type === 'posttest' &&
      posttestDueDate &&
      (progress ?? 0) >= 80 &&
      isPosttestDone === false &&
      hasPretestQuestions
    ) {
      setModalVisible(true);
    }
  }, [type, posttestDueDate, progress, isPosttestDone, hasPretestQuestions]);

  useEffect(() => {
    if (type === 'posttest' && progress !== undefined) {
      if (
        posttestDueDate &&
        (progress ?? 0) >= 80 &&
        isPosttestDone === false &&
        hasPretestQuestions
      ) {
        setModalVisible(true);
      }
    }
  }, [progress]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  // return state ที่ตรงกับ type
  return {
    isDone: type === 'pretest' ? isPretestDone : isPosttestDone,
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

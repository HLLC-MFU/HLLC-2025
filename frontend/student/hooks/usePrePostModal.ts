import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { useToastController } from '@tamagui/toast';
import { useTranslation } from 'react-i18next';

export type PrePostType = 'pretest' | 'posttest';

interface UsePrePostModalOptions {
  type: PrePostType;
}

export default function usePrePostModal({ type }: UsePrePostModalOptions) {
  const { t } = useTranslation();
  const toast = useToastController();
  // State สำหรับข้อมูล pretest/posttest
  const [isDone, setIsDone] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]); // TODO: ใส่ type ที่ถูกต้อง

  // ดึงสถานะว่าทำ pretest/posttest แล้วหรือยัง
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const url = type === 'pretest' ? '/pretest-answers/user' : '/posttest-answers/user';
      const res = await apiRequest<{ data: boolean }>(url, 'GET');
      setIsDone(res.data?.data ?? false);
      setModalVisible(!(res.data?.data ?? false));
    } catch (err) {
      setIsDone(false);
      setModalVisible(true);
      setError(type === 'pretest' ? 'ไม่สามารถเช็คสถานะ pretest ได้' : 'ไม่สามารถเช็คสถานะ posttest ได้');
    } finally {
      setLoading(false);
    }
  }, [type]);

  // ดึงคำถาม pretest/posttest
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: any[] }>('/prepost-questions', 'GET');
      // filter เฉพาะ pretest หรือ posttest
      const allQuestions = Array.isArray(res.data?.data) ? res.data.data : [];
      const filteredQuestions = allQuestions.filter(q => q.displayType === type);
      setQuestions(filteredQuestions);
    } catch (err) {
      setQuestions([]);
      setError(type === 'pretest' ? 'ไม่สามารถโหลดคำถาม pretest ได้' : 'ไม่สามารถโหลดคำถาม posttest ได้');
    } finally {
      setLoading(false);
    }
  }, [type]);

  // ส่งคำตอบ pretest/posttest
  const submit = useCallback(async (answerData: any = {}) => {
    setLoading(true);
    // แปลง answerData เป็น array ของ { id, answer }
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
      toast.show(
        t(`${type}.successTitle`),
        {
          message: t(`${type}.successMessage`),
          type: 'success',
        }
      );
    } catch (err) {
      setError(type === 'pretest' ? 'ส่งคำตอบ pretest ไม่สำเร็จ' : 'ส่งคำตอบ posttest ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [t, toast, type]);

  useEffect(() => {
    if (isDone) return; // ถ้าทำเสร็จแล้ว ไม่ต้อง fetch หรือเปิด modal
    fetchStatus();
    fetchQuestions();
  }, [isDone, fetchStatus, fetchQuestions]);

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
  };
} 
'use client';

import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import type { ReportTypes } from '@/types/report';

export function useReportTypes() {
  const [reporttypes, setReportTypes] = useState<ReportTypes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ data: ReportTypes[] }>('/report-types', 'GET');
      setReportTypes(res.data?.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report types');
      addToast({ title: 'Failed to fetch report types', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const addReportTypes = async (payload: Partial<ReportTypes>) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: ReportTypes }>('/report-types', 'POST', payload);
      await fetchReportTypes();
      addToast({ title: 'Category added!', color: 'success' });
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
      addToast({ title: 'Add failed', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const updateReportTypes = async (id: string, payload: Partial<ReportTypes>) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: ReportTypes }>(`/report-types/${id}`, 'PATCH', payload);
      await fetchReportTypes();
      addToast({ title: 'Category updated!', color: 'success' });
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      addToast({ title: 'Update failed', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const deleteReportTypes = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/report-types/${id}`, 'DELETE');
      if (res.statusCode === 200) {
        setReportTypes((prev) => prev.filter((r) => r._id !== id));
        addToast({ title: 'Category deleted!', color: 'success' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      addToast({ title: 'Delete failed', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return {
    reporttypes,
    loading,
    error,
    fetchReportTypes,
    addReportTypes,
    updateReportTypes,
    deleteReportTypes,
  };
}

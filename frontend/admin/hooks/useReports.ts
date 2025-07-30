'use client';

import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';
import type { Report } from '@/types/report';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const fetchReports = async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await apiRequest<{ data: Report[] }>(
      '/reports?limit=0',
      'GET'
    );
    setReports(res.data?.data ?? []);
  } catch (err: any) {
    setError(err.message || 'Failed to fetch reports');
    addToast({ title: 'Failed to fetch reports', color: 'danger' });
  } finally {
    setLoading(false);
  }
};



  const fetchReportsByCategory = async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: Report[] }>(`/reports/${categoryId}/categories`, 'GET');
      setReports(res.data?.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch by category');
      addToast({ title: 'Failed to fetch by category', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (payload: Partial<Report>) => {
    try {
      const res = await apiRequest<{ data: Report }>('/reports', 'POST', payload);
      if (res.data) {
        await fetchReports(); 
        addToast({ title: 'Report created!', color: 'success' });
        return res.data;
      }
    } catch (err: any) {
      addToast({ title: 'Create failed', color: 'danger' });
    }
  };

  const updateReport = async (id: string, payload: Partial<Report>) => {
    try {
      const res = await apiRequest<{ data: Report }>(`/reports/${id}`, 'PATCH', payload);
      if (res.data) {
        await fetchReports();
        addToast({ title: 'Report updated!', color: 'success' });
        return res.data;
      }
    } catch (err: any) {
      addToast({ title: 'Update failed', color: 'danger' });
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const res = await apiRequest(`/reports/${id}`, 'DELETE');
      if (res.statusCode === 200) {
        setReports(prev => prev.filter(res => res._id !== id));
        addToast({ title: 'Report deleted!', color: 'success' });
      }
    } catch (err: any) {
      addToast({ title: 'Delete failed', color: 'danger' });
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports,
    fetchReportsByCategory,
    createReport,
    updateReport,
    deleteReport,
  };
}

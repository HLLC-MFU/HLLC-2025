import { ReportType, Report } from '@/types/reports';
import { apiRequest } from '@/utils/api';
import { addToast } from '@heroui/react';
import { useEffect, useState } from 'react';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ data: ReportType[] }>(
        '/report-types',
        'GET',
      );
      setReportTypes(
        Array.isArray(response.data?.data) ? response.data?.data : [],
      );
    } catch (err) {
      addToast({
        title: 'Failed to fetch report types',
        color: 'danger',
        variant: 'solid',
      });

      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch report types.'
          : 'Failed to fetch report types.',
      );
    } finally {
      setLoading(false);
    }
  };

  const createReports = async (reportData: Partial<Report>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<Report>('/reports', 'POST', reportData);
      if (response.data) {
        setReports(prev => [...prev, response.data as Report]);
        addToast({
          title: 'Reports created successfully',
          color: 'success',
          classNames: {
            base: 'text-white',
            title: 'text-white'
          },
          variant: 'solid',
        });
      }
    } catch (err) {
      addToast({
        title: 'Failed to create reports',
        color: 'danger',
        variant: 'solid',
      });

      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to create reports.'
          : 'Failed to create reports.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return { reports, reportTypes, error, loading, createReports };
}

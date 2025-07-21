import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { ISponsor } from '@/types/sponsor';

type SponsorRaw = {
  _id: string;
  name: { en: string; th: string };
  logo?: { logoPhoto: string };
  photo?: { logoPhoto: string };
  type: any;
  color?: any;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

export function useSponsors() {
  const [sponsors, setSponsors] = useState<ISponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sponsors
  const fetchSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ data: SponsorRaw[] }>('/sponsors', 'GET');
      
      if (response.data) {
        // Map photo.logoPhoto จาก logo.logoPhoto เสมอ
        const sponsorsWithPhoto: ISponsor[] = (response.data.data || []).map((s: SponsorRaw) => ({
          ...s,
          photo: { logoPhoto: s.logo?.logoPhoto || '' },
        }));
        setSponsors(sponsorsWithPhoto);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch sponsors.'
        : 'Failed to fetch sponsors.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch sponsors with evouchers
  const fetchSponsorsWithEvouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ data: SponsorRaw[] }>('/sponsors', 'GET');
      if (response.data) {
        const sponsorsRaw = response.data?.data || response.data || [];
        const sponsorsWithPhoto: ISponsor[] = sponsorsRaw.map((s: SponsorRaw) => ({
          ...s,
          photo: { logoPhoto: s.logo?.logoPhoto || '' },
        }));
        setSponsors(sponsorsWithPhoto);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch sponsors.'
        : 'Failed to fetch sponsors.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sponsors,
    loading,
    error,
    fetchSponsors,
    fetchSponsorsWithEvouchers,
  };
} 
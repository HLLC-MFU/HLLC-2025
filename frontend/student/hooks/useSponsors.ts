import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { ISponsor, ISponsorResponse } from '@/types/sponsor';

export function useSponsors() {
  const [sponsors, setSponsors] = useState<ISponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sponsors
  const fetchSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<ISponsorResponse>('/sponsors', 'GET');
      
      if (response.data) {
        setSponsors(response.data.data || []);
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
  const fetchSponsorsWithEvouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<ISponsorResponse>('/sponsors', 'GET');
      
      if (response.data) {
        setSponsors(response.data.data || []);
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

  return {
    sponsors,
    loading,
    error,
    fetchSponsors,
    fetchSponsorsWithEvouchers,
  };
} 
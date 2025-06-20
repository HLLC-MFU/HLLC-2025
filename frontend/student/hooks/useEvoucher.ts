import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { IEvoucher, IEvoucherCode, IEvoucherCodeResponse, IEvoucherResponse } from '@/types/evoucher';


export function useEvoucher() {
  const [evouchers, setEvouchers] = useState<IEvoucher[]>([]);
  const [evoucherCodes, setEvoucherCodes] = useState<IEvoucherCode[]>([]);
  const [myEvoucherCodes, setMyEvoucherCodes] = useState<IEvoucherCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all evouchers
  const fetchEvouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherResponse>('/evoucher?limit=0', 'GET');
      
      if (response.data) {
        setEvouchers(response.data.data || []);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch evouchers.'
        : 'Failed to fetch evouchers.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch evouchers by sponsor ID
  const fetchEvouchersBySponsor = async (sponsorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherResponse>(`/evoucher?sponsors=${sponsorId}&limit=0`, 'GET');
      
      if (response.data) {
        setEvouchers(response.data.data || []);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch evouchers.'
        : 'Failed to fetch evouchers.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch evoucher codes for a specific evoucher
  const fetchEvoucherCodes = async (evoucherId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherCodeResponse>(`/evoucher-code?evoucher=${evoucherId}&limit=0`, 'GET');
      
      if (response.data) {
        setEvoucherCodes(response.data.data || []);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch evoucher codes.'
        : 'Failed to fetch evoucher codes.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch my evoucher codes (user's claimed evouchers)
  const fetchMyEvoucherCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherCodeResponse>('/evoucher-code/my-codes', 'GET');
      
      if (response.data) {
        setMyEvoucherCodes(response.data.data || []);
      }
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch my evoucher codes.'
        : 'Failed to fetch my evoucher codes.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get evoucher codes for a specific sponsor
  const getEvoucherCodesBySponsor = (sponsorId: string) => {
    return myEvoucherCodes.filter(code => code.evoucher.sponsors._id === sponsorId);
  };

  // Check if user has evoucher codes for a sponsor
  const hasEvoucherCodesForSponsor = (sponsorId: string) => {
    return myEvoucherCodes.some(code => code.evoucher.sponsors._id === sponsorId);
  };

  // Claim an evoucher code
  const claimEvoucherCode = async (evoucherId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherCode>(`/evoucher-code/claim/${evoucherId}`, 'POST');
      
      // Refresh my evoucher codes after claiming
      await fetchMyEvoucherCodes();
      
      return response;
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to claim evoucher code.'
        : 'Failed to claim evoucher code.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    evouchers,
    evoucherCodes,
    myEvoucherCodes,
    loading,
    error,
    fetchEvouchers,
    fetchEvouchersBySponsor,
    fetchEvoucherCodes,
    fetchMyEvoucherCodes,
    getEvoucherCodesBySponsor,
    hasEvoucherCodesForSponsor,
    claimEvoucherCode,
  };
} 
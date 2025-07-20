import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { IEvoucher, IEvoucherCode, IEvoucherCodeResponse, IEvoucherResponse } from '@/types/evoucher';
import * as SecureStore from 'expo-secure-store';


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
      const response = await apiRequest<IEvoucherResponse>('/evouchers?limit=0', 'GET');
      
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
      const response = await apiRequest<IEvoucherResponse>(`/evouchers?sponsors=${sponsorId}&limit=0`, 'GET');
      if (Array.isArray(response.data)) {
        setEvouchers(response.data);
      } else {
        setEvouchers([]);
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
      const response = await apiRequest<IEvoucherCodeResponse>(`/evoucher-codes?evoucher=${evoucherId}&limit=0`, 'GET');
      let codes: IEvoucherCode[] = [];
      if (Array.isArray(response.data)) {
        codes = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        codes = response.data.data;
      }
      setEvoucherCodes(codes);
      return response;
    } catch (err) {
      setEvoucherCodes([]);
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
  const fetchMyEvoucherCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<IEvoucherCodeResponse>('/evoucher-codes/my-code', 'GET');
      let codes: IEvoucherCode[] = [];
      if (
        response.data &&
        typeof response.data === 'object' &&
        Array.isArray(response.data.data)
      ) {
        codes = response.data.data;
      }
      setMyEvoucherCodes(codes);
      return response;
    } catch (err) {
      setMyEvoucherCodes([]);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as { message?: string }).message || 'Failed to fetch my evoucher codes.'
        : 'Failed to fetch my evoucher codes.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get evoucher codes for a specific sponsor
  const getEvoucherCodesBySponsor = (sponsorId: string) => {
    const codes = Array.isArray(myEvoucherCodes) ? myEvoucherCodes : [];
    return codes.filter(code => {
      const sponsorIdFromObject = code?.evoucher?.sponsors?._id;
      const sponsorIdFromString = code?.evoucher?.sponsor;
      return (
        (sponsorIdFromObject && sponsorIdFromObject.toString() === sponsorId.toString()) ||
        (sponsorIdFromString && sponsorIdFromString.toString() === sponsorId.toString())
      );
    });
  };

  // Check if user has evoucher codes for a sponsor
  const hasEvoucherCodesForSponsor = (sponsorId: string) => {
    const codes = Array.isArray(myEvoucherCodes) ? myEvoucherCodes : [];
    return codes.some(code => {
      const sponsorIdFromObject = code?.evoucher?.sponsors?._id;
      const sponsorIdFromString = code?.evoucher?.sponsor;
      return (
        (sponsorIdFromObject && sponsorIdFromObject.toString() === sponsorId.toString()) ||
        (sponsorIdFromString && sponsorIdFromString.toString() === sponsorId.toString())
      );
    });
  };

  // Claim an evoucher code
  const claimEvoucherCode = async (evoucherId: string) => {
    setLoading(true);
    setError(null);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await apiRequest<IEvoucherCode>(`/evouchers/${evoucherId}/claim`, 'POST', { user: userId });
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

  // Mark an evoucher code as used (use voucher)
  const useVoucherCode = async (
    evoucherCodeId: string,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/evoucher-codes/${evoucherCodeId}/used`, 'POST', {});
      if (response.statusCode === 200 || response.statusCode === 201) {
        onSuccess?.();
      } else {
        onError?.(response.message || 'Failed to use evoucher code');
      }
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to use evoucher code. Please try again.'
          : 'Failed to use evoucher code. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
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
    useVoucherCode,
  };
} 
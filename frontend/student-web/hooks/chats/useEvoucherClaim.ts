import { useState, useCallback } from 'react';

interface EvoucherClaimResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface UseEvoucherClaimReturn {
  isClaiming: boolean;
  isClaimed: boolean;
  error: string | null;
  claimEvoucher: (claimUrl: string, messageId?: string) => Promise<EvoucherClaimResponse>;
  resetState: () => void;
}

export const useEvoucherClaim = (): UseEvoucherClaimReturn => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimEvoucher = useCallback(async (claimUrl: string, messageId?: string): Promise<EvoucherClaimResponse> => {
    if (!claimUrl) {
      const errorMsg = 'ไม่พบ URL สำหรับรับ E-Voucher';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsClaiming(true);
    setError(null);

    try {
      const response = await fetch(claimUrl, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: messageId,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setIsClaimed(true);
        console.log('🎉 E-Voucher claimed successfully:', result);
        return { success: true, message: 'รับ E-Voucher สำเร็จ!', data: result };
      } else {
        const errorMsg = result.message || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรับ E-Voucher';
      console.error('❌ Error claiming E-Voucher:', err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsClaiming(false);
    }
  }, []);

  const resetState = useCallback(() => {
    setIsClaiming(false);
    setIsClaimed(false);
    setError(null);
  }, []);

  return {
    isClaiming,
    isClaimed,
    error,
    claimEvoucher,
    resetState
  };
}; 
import { useState, useCallback } from 'react';
import { getToken } from '@/utils/storage';

interface EvoucherClaimResponse {
  success: boolean;
  message?: string;
  data?: any;
  alreadyClaimed?: boolean; // เพิ่มเพื่อระบุว่าเคยรับไปแล้ว
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
      // Get the access token for authentication
      const accessToken = getToken('accessToken');

      if (!accessToken) {
        const errorMsg = 'ไม่พบ Token สำหรับการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      const response = await fetch(claimUrl, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        // ส่ง empty string เป็น body เพื่อหลีกเลี่ยง error
        body: '',
      });

      const result = await response.json();

      if (response.ok) {
        setIsClaimed(true);
        console.log('🎉 E-Voucher claimed successfully:', result);
        return {
          success: true,
          message: result.message || 'รับ E-Voucher สำเร็จ!',
          data: result
        };
      } else {
        console.log('🔥 [DEBUG] Response not OK. Status:', response.status);
        console.log('🔥 [DEBUG] Result object:', result);
        console.log('🔥 [DEBUG] result.message:', result.message);
        console.log('🔥 [DEBUG] result.error:', result.error);
        console.log('🔥 [DEBUG] result.statusCode:', result.statusCode);
        
        // ตรวจสอบว่าเป็น error ที่เคยรับไปแล้วหรือไม่
        if (response.status === 400 && result.message === 'You have already claimed this evoucher') {
          console.log('🔥 [DEBUG] Already claimed condition matched!');
          return {
            success: false,
            message: 'You already claimed this evoucher',
            alreadyClaimed: true
          };
        }

        console.log('🔥 [DEBUG] Not already claimed, treating as other error');
        // กรณี error อื่นๆ
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
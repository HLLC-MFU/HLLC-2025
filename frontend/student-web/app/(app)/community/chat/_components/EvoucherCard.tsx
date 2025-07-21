import React, { useState, useCallback } from 'react';
import { IMAGE_BASE_URL } from '@/configs/chats/chatConfig';

interface EvoucherInfo {
  claimUrl?: string;
  message?: {
    th?: string;
    en?: string;
  };
  sponsorImage?: string;
  evoucherId?: string;
}

interface EvoucherCardProps {
  evoucherInfo: EvoucherInfo;
  messageId: string;
  onSuccess?: () => void;
}

const EvoucherCard = ({ evoucherInfo, messageId, onSuccess }: EvoucherCardProps) => {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimDialogMessage, setClaimDialogMessage] = useState('');
  const [claimDialogType, setClaimDialogType] = useState<'success' | 'error' | 'info'>('info');

  const showDialog = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setClaimDialogMessage(message);
    setClaimDialogType(type);
    setShowClaimDialog(true);
  }, []);

  const handleClaim = async () => {
    if (claimed || claiming) {
      return;
    }
    
    setClaiming(true);
    
    try {
      const response = await fetch(evoucherInfo.claimUrl!, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: messageId,
          evoucherId: evoucherInfo.evoucherId || null,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setClaimed(true);
        showDialog('🎉 คุณได้รับ E-Voucher แล้ว!', 'success');
        onSuccess?.();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'ไม่สามารถรับ E-Voucher ได้';
        // เช็คข้อความ error
        if (errorMessage.toLowerCase().includes('already claimed')) {
          showDialog('คุณเคยรับ E-Voucher นี้ไปแล้ว', 'info');
        } else {
          showDialog(`❌ ${errorMessage}`, 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error claiming E-Voucher:', error);
      showDialog('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const displayLang = 'th';

  return (
    <>
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl border-2 border-amber-300/50 shadow-lg w-full max-w-sm sm:max-w-md">
        <div className="p-5">
          {/* Sponsor Image */}
          {evoucherInfo.sponsorImage && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md">
                <img
                  src={evoucherInfo.sponsorImage.startsWith('http') 
                    ? evoucherInfo.sponsorImage 
                    : `${IMAGE_BASE_URL}/uploads/${evoucherInfo.sponsorImage}`
                  }
                  alt="Sponsor"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl text-amber-800 dark:text-amber-200 leading-tight break-words mb-1">
              {evoucherInfo.message?.[displayLang] || 'E-Voucher'}
            </h3>
          </div>

          {/* E-Voucher Details */}
          <div className="mb-4 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">E-Voucher Code</span>
              <div 
                className="text-xs text-amber-600 dark:text-amber-400 font-mono tracking-wider cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 px-2 py-1 rounded transition-all duration-300"
              >
                <span className="animate-pulse tracking-tight whitespace-nowrap">❓❓❓</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Valid Until</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Value</span>
              <div 
                className="text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 px-2 py-1 rounded transition-all duration-300"
              >
                <span className="animate-pulse tracking-tight whitespace-nowrap">❓❓❓</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          {!claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming || !evoucherInfo.claimUrl}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                claiming
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-400 text-amber-900 hover:bg-amber-500 shadow-lg hover:shadow-xl'
              }`}
            >
              {claiming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">กำลังเคลม...</span>
                </div>
              ) : (
                <span className="text-sm">Claim</span>
              )}
            </button>
          )}
          
          {/* Success Message */}
          {claimed && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-green-600 dark:text-green-400 font-bold text-base">
                คุณได้รับ E-Voucher แล้ว!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Dialog */}
      {showClaimDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className={`max-w-sm w-full mx-4 p-6 rounded-2xl shadow-2xl transform transition-all duration-300 ${
            claimDialogType === 'success' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
              : claimDialogType === 'error'
              ? 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
          }`}>
            <div className="text-center">
              <div className={`text-4xl mb-4 ${
                claimDialogType === 'success' ? 'animate-bounce' : ''
              }`}>
                {claimDialogType === 'success' ? '🎉' : claimDialogType === 'error' ? '❌' : 'ℹ️'}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                claimDialogType === 'success' ? 'text-green-800' 
                : claimDialogType === 'error' ? 'text-red-800' 
                : 'text-blue-800'
              }`}>
                {claimDialogType === 'success' ? 'สำเร็จ!' 
                 : claimDialogType === 'error' ? 'เกิดข้อผิดพลาด' 
                 : 'แจ้งเตือน'}
              </h3>
              <p className={`text-sm leading-relaxed ${
                claimDialogType === 'success' ? 'text-green-700' 
                : claimDialogType === 'error' ? 'text-red-700' 
                : 'text-blue-700'
              }`}>
                {claimDialogMessage}
              </p>
              <button
                onClick={() => setShowClaimDialog(false)}
                className={`mt-4 px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                  claimDialogType === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                    : claimDialogType === 'error'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EvoucherCard; 
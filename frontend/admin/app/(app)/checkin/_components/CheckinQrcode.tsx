import { Scanner } from '@yudiel/react-qr-scanner';
import { addToast } from '@heroui/react';
import { useCheckin } from '@/hooks/useCheckin';

interface QrCodeScannerProps {
  selectedActivityIds: string[];
}

export function CheckinQrcode({ selectedActivityIds }: QrCodeScannerProps) {
  const { createcheckin } = useCheckin();

  const startScanner = async (studentId: string) => {
    try {
      await createcheckin({
        user: studentId,
        activities: selectedActivityIds,
      });

      addToast({
        title: 'Checkin Finish',
        color: 'success'
      });

    } catch (error : any) {

      if (error?.response?.status === 400 ){
        addToast({
          title: 'This User is checkin this activty ',
          color: 'warning'
        })
      }
      
      addToast({
        title: 'Checkin Activity Fail',
        color: 'danger',
      });
      
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto mb-4 sm:overflow-hidden sm:hidden">
      {selectedActivityIds.length === 0 ? (
        <div className="w-full h-[250px] bg-black flex items-center justify-center text-white text-base font-bold rounded-lg">
          กรุณาเลือกกิจกรรม
        </div>
      ) : (
        <Scanner
          onScan={(detectedCodes) => {
            const value = detectedCodes?.[0]?.rawValue;
            if (value) {
              startScanner(value);
            }
          }}
        />
      )}
    </div>
  );
}

import { Scanner } from '@yudiel/react-qr-scanner';
import { useCheckin } from '@/hooks/useCheckin';

interface QrCodeScannerProps {
  selectedActivityIds: string[];
}

export function CheckinQrcode({ selectedActivityIds }: QrCodeScannerProps) {
  const { createcheckin } = useCheckin();

  const checkinScanner = async (studentId: string) => {
      await createcheckin({
        user: studentId,
        activities: selectedActivityIds,
      });
    }
    
  return (
    <div className="w-full max-w-sm mx-auto mb-4 sm:overflow-hidden sm:hidden">
      {selectedActivityIds.length === 0 ? (
        <div className="w-full h-[250px] bg-black flex items-center justify-center text-white text-base font-bold rounded-lg">
          <p>Please select activities</p>
        </div>
      ) : (
        <Scanner
          onScan={(detectedCodes) => {
            const value = detectedCodes?.[0]?.rawValue;
            if (value) {
              checkinScanner(value);
            }
          }}
        />
      )}
    </div>
  );
}

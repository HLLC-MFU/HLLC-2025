import { useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CustomFinderTracker } from './CustomOutline';

type QrCodeScannerProps = {
  selectedActivityId: string[];
  onCheckin: (studentId: string) => Promise<void>;
};

export function QrCodeScanner({ selectedActivityId, onCheckin }: QrCodeScannerProps) {
  const isProcessingRef = useRef(false);

  const handleScan = async (detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;

    const result = detectedCodes[0]?.rawValue;
    if (!result) return;

    let studentId = result;
    try {
      const parsed = JSON.parse(result);
      studentId = parsed.username || parsed.studentId || parsed.id || result;
    } catch { }

    if (!/^\d{10}$/.test(studentId)) {
      console.error('Invalid studentId:', studentId);
      return;
    }

    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    try {
      await onCheckin(studentId);
    } catch {
      return;
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  if (selectedActivityId.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto mb-4">
        <p className="text-center p-2">Please select activities before checkin.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto mb-4 rounded-xl overflow-hidden">
      <Scanner onScan={handleScan}
        constraints={{ facingMode: 'environment' }}
        components={{
          finder: false,
          zoom: true,
          tracker: CustomFinderTracker,
        }}
        styles={{
          container: { width: '400px', height: '400px' },
        }}
        allowMultiple={true}
        sound={false}
      />
    </div>
  );
}

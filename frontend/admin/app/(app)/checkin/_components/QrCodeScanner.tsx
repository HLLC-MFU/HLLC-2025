import { useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CustomFinderTracker } from './CustomOutline';

type QrCodeScannerProps = {
  selectedActivityId: string[];
  onCheckin: (studentId: string, selectedActivityId: string[]) => Promise<void>;
  sound: boolean;
};

export function QrCodeScanner({ selectedActivityId, onCheckin, sound }: QrCodeScannerProps) {
  const isProcessingRef = useRef(false);
  const selectedActivityIdRef = useRef<string[]>(selectedActivityId);

  // Sync ref with latest prop
  useEffect(() => {
    selectedActivityIdRef.current = selectedActivityId;
  }, [selectedActivityId]);

  const handleScan = async (detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;

    const result = detectedCodes[0]?.rawValue;
    if (!result) return;

    let studentId = result;
    try {
      const parsed = JSON.parse(result);
      studentId = parsed.username || parsed.studentId || parsed.id || result;
    } catch { }

    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    try {
      await onCheckin(studentId, selectedActivityIdRef.current);
    } catch (err) {
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
        sound={sound}
      />
    </div>
  );
}

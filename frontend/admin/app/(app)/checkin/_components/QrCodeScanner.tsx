import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { addToast } from '@heroui/react';

type QrCodeScannerProps = {
  selectedActivityId: string[];
  onCheckin: (studentId: string) => Promise<void>;
};

export function QrCodeScanner({
  selectedActivityId,
  onCheckin,
}: QrCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const scannedSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const qrRegionId = 'qr-reader';
    let isMounted = true;

    const stopScanner = async () => {
      if (scannerRef.current && isRunningRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.warn('Scanner stop error:', err);
        }

        try {
          const region = document.getElementById(qrRegionId);

          if (region) {
            await scannerRef.current.clear();
          }
        } catch (err) {
          console.warn('Scanner clear error:', err);
        }

        isRunningRef.current = false;
      }
    };

    const startScanner = async () => {
      if (selectedActivityId.length === 0) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      try {
        const devices = await Html5Qrcode.getCameras();

        if (!isMounted || devices.length === 0) {
          return;
        }

        const cameraId = devices[0].id;

        await scannerRef.current.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (!decodedText || scannedSetRef.current.has(decodedText)) return;

            try {
              let studentId = decodedText;

              try {
                const parsed = JSON.parse(decodedText);
                studentId =
                  parsed.username ||
                  parsed.studentId ||
                  parsed.id ||
                  decodedText;
              } catch {}

              if (!/^\d{10}$/.test(studentId)) {
                throw new Error('รหัสนักศึกษาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
              }

              scannedSetRef.current.add(studentId);
              await onCheckin(studentId);
            } catch (err: any) {
              console.error('Checkin error:', err);
              addToast({
                title: 'เกิดข้อผิดพลาด',
                description:
                  err instanceof Error ? err.message : 'ไม่สามารถส่งข้อมูลได้',
                color: 'danger',
              });
            }
          },
          () => {},
        );

        isRunningRef.current = true;
      } catch (err) {
        console.error('Camera start error:', err);
      }
    };

    (async () => {
      await stopScanner();
      if (selectedActivityId.length > 0) {
        await startScanner();
      }
    })();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [selectedActivityId, onCheckin]);

  return (
    <div className="w-full max-w-sm mx-auto mb-4">
      {selectedActivityId.length === 0 ? (
        <p className="text-center p-2">Please select activities</p>
      ) : (
        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
      )}
    </div>
  );
}

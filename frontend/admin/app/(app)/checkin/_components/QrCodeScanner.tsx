import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { addToast } from '@heroui/react';
import { useCheckin } from '@/hooks/useCheckin';

interface QrCodeScannerProps {
  selectedActivityIds: string[];
}

export function QrCodeScanner({ selectedActivityIds }: QrCodeScannerProps) {
  const { createcheckin } = useCheckin();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const scannedSetRef = useRef<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640); // sm breakpoint (640px)
    };

    handleResize(); // set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const qrRegionId = 'qr-reader';
    let isMounted = true;

    const stopScanner = async () => {
      if (scannerRef.current && isRunningRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
        isRunningRef.current = false;
      }
    };

    const startScanner = async () => {
      if (selectedActivityIds.length === 0 || !isMobile) return;

      const scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted || devices.length === 0) return;

        const cameraId = devices[0].id;
        await scanner.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          async decodedText => {
            if (!decodedText || scannedSetRef.current.has(decodedText)) return;

            scannedSetRef.current.add(decodedText);

            try {
              await createcheckin({
                user: decodedText,
                activities: selectedActivityIds,
              });

              addToast({
                title: 'สแกนสำเร็จ',
                description: `${decodedText} ได้ทำการ check-in`,
                color: 'success',
              });
            } catch (err) {
              addToast({
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถส่งข้อมูลได้',
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
      if (selectedActivityIds.length > 0 && isMobile) {
        await startScanner();
      }
    })();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [selectedActivityIds, isMobile]);

  if (!isMobile) return null;

  return (
    <div className="w-full max-w-sm mx-auto mb-4 sm:overflow-hidden sm:hidden">
      {selectedActivityIds.length === 0 ? (
        <div
          style={{
            width: '100%',
            height: '250px',
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '10px',
          }}
        >
          กรุณาเลือกกิจกรรม
        </div>
      ) : (
        <div
          id="qr-reader"
          style={{ width: '100%' }}
          className="w-full rounded-xl overflow-hidden"
        />
      )}
    </div>
  );
}

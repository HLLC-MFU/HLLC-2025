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
        if (!isMounted || devices.length === 0) {
          addToast({
            title: 'Camera Error',
            description: 'ไม่พบกล้อง กรุณาอนุญาตการใช้งานกล้อง',
            color: 'danger',
          });
          return;
        }

        const cameraId = devices[0].id;
        await scanner.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          async decodedText => {
            if (!decodedText || scannedSetRef.current.has(decodedText)) return;

            try {
              // ตรวจสอบรูปแบบรหัสนักศึกษา
              let studentId = decodedText;
              try {
                const parsed = JSON.parse(decodedText);
                studentId = parsed.username || parsed.studentId || parsed.id || decodedText;
              } catch (e) {
                // ถ้าไม่ใช่ JSON ใช้ค่าเดิม
              }

              if (!/^\d{10}$/.test(studentId)) {
                throw new Error('รหัสนักศึกษาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
              }

              scannedSetRef.current.add(studentId);

              await createcheckin({
                user: studentId,
                activities: selectedActivityIds,
              });

              addToast({
                title: 'สแกนสำเร็จ',
                description: `รหัสนักศึกษา ${studentId} ได้ทำการ check-in`,
                color: 'success',
              });
            } catch (err: any) {
              console.error('Checkin error:', err);
              addToast({
                title: 'เกิดข้อผิดพลาด',
                description: err instanceof Error ? err.message : 'ไม่สามารถส่งข้อมูลได้',
                color: 'danger',
              });
            }
          },
          () => {},
        );

        isRunningRef.current = true;
      } catch (err) {
        console.error('Camera start error:', err);
        addToast({
          title: 'Camera Error',
          description: 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง',
          color: 'danger',
        });
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
        <div className="w-full h-[250px] bg-black flex items-center justify-center text-white text-base font-bold rounded-lg">
          กรุณาเลือกกิจกรรม
        </div>
      ) : (
        <div
          id="qr-reader"
          className="w-full rounded-xl overflow-hidden"
        />
      )}
    </div>
  );
}

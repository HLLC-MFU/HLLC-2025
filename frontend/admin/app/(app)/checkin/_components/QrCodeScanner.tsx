import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const qrRegionId = 'qr-reader';
    const scanner = new Html5Qrcode(qrRegionId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras().then(devices => {
      if (devices.length > 0) {
        const cameraId = devices[0].id;

        if (isRunningRef.current) {
          scanner.clear();
        }

        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: 250 },
            async decodedText => {
              if (!decodedText || scannedSetRef.current.has(decodedText))
                return;

              if (selectedActivityIds.length === 0) {
                setTimeout(() => {
                  addToast({
                    title: 'กรุณาเลือกกิจกรรม',
                    description: 'คุณต้องเลือกกิจกรรมก่อนสแกน',
                    color: 'danger',
                  });
                }, 2000);

                return;
              }

              scannedSetRef.current.add(decodedText);

              console.log('ค่าที่แสกนได้ ', decodedText);

              try {
                createcheckin({
                  user: decodedText,
                  activities: selectedActivityIds,
                });

                addToast({
                  title: 'สแกนสำเร็จ',
                  description: `${decodedText} ได้ทำการ check-in`,
                  color: 'success',
                });
              } catch (err) {
                console.error('POST error:', err);
                addToast({
                  title: 'เกิดข้อผิดพลาด',
                  description: 'ไม่สามารถส่งข้อมูลได้',
                  color: 'danger',
                });
              }
            },
            error => {},
          )
          .then(() => {
            isRunningRef.current = true;
          })
          .catch(err => {
            console.error('Camera start error:', err);
          });
      }
    });

    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          isRunningRef.current = false;
        });
      }
    };
  }, [selectedActivityIds]);

  return (
    <div className="w-full max-w-sm mx-auto mb-4 sm:overflow-hidden sm:hidden">
      <div id="qr-reader" style={{ width: '100%', height: '100%'}} />
    </div>
  );
}

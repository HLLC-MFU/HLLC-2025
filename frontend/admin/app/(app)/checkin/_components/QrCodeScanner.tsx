import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { addToast } from '@heroui/react';

export function QrCodeScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const scannedSetRef = useRef<Set<string>>(new Set()); // เก็บค่าที่เคยสแกน

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
            decodedText => {
              if (!decodedText) return;

              if (scannedSetRef.current.has(decodedText)) {
                return;
              }

              scannedSetRef.current.add(decodedText);
              console.log('QR Code detected:', decodedText);

              addToast({
                title: 'Scan Finish',
                description: `${decodedText} has been added`,
                color: 'success',
              });
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
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto mb-4 sm:overflow-hidden sm:hidden">
      <div id="qr-reader" style={{ width: '100%' }} />
    </div>
  );
}

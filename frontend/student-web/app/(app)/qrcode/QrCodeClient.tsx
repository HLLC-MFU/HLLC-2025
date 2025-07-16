'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Button, addToast } from '@heroui/react';
import { Save } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import QRCodeSkeleton from './_components/QRCodeSkeleton';
import { useProfile } from '@/hooks/useProfile';
import dynamic from 'next/dynamic';
import { apiRequest } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { CustomFinderTracker } from './_components/CustomFinderTracker';
import { useTranslation } from 'react-i18next';
import '@/locales/i18n';

const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner),
  { ssr: false }
);

export default function QrCodeClient() {
  const { user, loading, fetchUser } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<'show' | 'scan'>('show');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'scan' || tabParam === 'show') {
      setTab(tabParam);
      resetScanner();
    }
    // eslint-disable-next-line
  }, [searchParams]);

  function showErrorAlert(message: string) {
    const displayMessage =
      message && message.toLowerCase().includes('internal server')
        ? t('qrcode.scanError')
        : message;
    addToast({
      title: displayMessage,
      color: 'danger',
    });
    resetScanner();
  }

  function validateAndParseHLLCQR(data: string): { qrPath: string, qrPayload: string } | null {
    if (!data.startsWith('hllc:')) return null;
    const jsonStr = data.slice(5);
    let qrObj: Record<string, string>;
    try {
      qrObj = JSON.parse(jsonStr);
    } catch {
      return null;
    }
    const [qrPath, qrPayload] = Object.entries(qrObj)[0] || [];
    if (!qrPath || !qrPayload) return null;
    return { qrPath, qrPayload };
  }

  function resetScanner() {
    setScanning(false);
    scanningRef.current = false;
    setScanResult(null);
  }

  const handleBarcodeScanned = async (data: string) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    const parsed = validateAndParseHLLCQR(data);
    if (!parsed) {
      showErrorAlert(t('qrcode.invalidQR'));
      return;
    }
    const { qrPath, qrPayload } = parsed;

    try {
      if (!user?._id && !user?.username) {
        showErrorAlert(t('qrcode.noUser'));
        return;
      }
      const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error(t('qrcode.noGeolocation')));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            err => reject(new Error(t('qrcode.allowLocation'))),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      };
      let userLat = 0, userLong = 0;
      try {
        const loc = await getLocation();
        userLat = loc.latitude;
        userLong = loc.longitude;
      } catch (e: any) {
        showErrorAlert(e.message || t('qrcode.locationError'));
        return;
      }
      const userId = user._id || user.username;
      const path = `/${qrPath}`;
      let body: any = { user: userId, userLat, userLong };
      const payloadTrimmed = qrPayload.trim();
      if (payloadTrimmed.startsWith('{') || payloadTrimmed.startsWith('[')) {
        try {
          const parsedPayload = JSON.parse(payloadTrimmed);
          body = { ...body, ...parsedPayload };
        } catch (e) {
          showErrorAlert(t('qrcode.invalidPayload'));
          return;
        }
      } else {
        body = qrPath === 'coin-collections/collect'
          ? { ...body, landmark: qrPayload.trim() }
          : { ...body, id: qrPayload.trim() };
      }
      const res = await apiRequest<any>(path, 'POST', body);
      if (qrPath === 'coin-collections/collect') {
        if (res.statusCode === 200 || res.statusCode === 201) {
          router.push(`/community/coin-hunting?modal=success${res?.data?.evoucher?.code ? `&code=${encodeURIComponent(res.data.evoucher.code)}` : ''}`);
        } else if (res.statusCode === 409 || (res.message && res.message.toLowerCase().includes('already'))) {
          router.push('/community/coin-hunting?modal=alert&type=already-collected');
        } else if (res.statusCode === 204 || (res.message && res.message.toLowerCase().includes('no new evoucher'))) {
          router.push('/community/coin-hunting?modal=alert&type=no-evoucher');
        } else if (res.statusCode === 403 || (res.message && res.message.toLowerCase().includes('too far'))) {
          router.push('/community/coin-hunting?modal=alert&type=too-far');
        } else if (res.statusCode === 429 || (res.message && res.message.toLowerCase().includes('cooldown'))) {
          router.push(`/community/coin-hunting?modal=alert&type=cooldown&remainingCooldownMs=${res?.data?.remainingCooldownMs ?? 0}`);
        } else {
          showErrorAlert(res.message || t('qrcode.checkinFailed'));
        }
        resetScanner();
        return;
      }
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        showErrorAlert(res.message || t('qrcode.checkinFailed'));
        return;
      }
      addToast({
        title: t('qrcode.success'),
        color: 'success',
      });
    } catch (e: any) {
      const errMsg = e.message && e.message.toLowerCase().includes('internal server')
        ? t('qrcode.scanError')
        : t('qrcode.scanFailed', { error: e.message || 'Unknown error' });
      showErrorAlert(errMsg);
      return;
    }
    resetScanner();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${user?.username ?? 'qrcode'}.png`;
    link.click();
  };

  if (loading || !user) return <QRCodeSkeleton />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 mx-4 w-full max-w-md">
        {/* Tab UI - pill style with blur and animated indicator */}
        <div className="relative w-full flex items-center justify-center mb-8 select-none border border-white/30 rounded-full shadow-lg backdrop-blur-md bg-white/10" style={{height: 56}}>
          {/* Focus pill indicator */}
          <div
            className={`absolute top-0 left-0 h-14 w-1/2 transition-transform duration-200 ease-out z-0 rounded-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg`}
            style={{
              transform: tab === 'show' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.22s cubic-bezier(.4,1.2,.4,1)',
            }}
          />
          {/* Tab buttons */}
          <button
            className={`relative flex-1 h-14 z-10 rounded-l-full font-bold transition-colors duration-200 text-lg
              ${tab === 'show' ? 'text-white' : 'text-white/70'}`}
            onClick={() => { setTab('show'); resetScanner(); }}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className="drop-shadow-sm">{t('qrcode.showTab')}</span>
          </button>
          <button
            className={`relative flex-1 h-14 z-10 rounded-r-full font-bold transition-colors duration-200 text-lg
              ${tab === 'scan' ? 'text-white' : 'text-white/70'}`}
            onClick={() => { setTab('scan'); resetScanner(); }}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className="drop-shadow-sm">{t('qrcode.scanTab')}</span>
          </button>
        </div>

        {/* Content wrapper: fix size and center content, like mobile */}
        <div className="min-h-[420px] h-[420px] w-full flex flex-col justify-center items-center">
          {tab === 'show' ? (
            <div
              className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl shadow-lg bg-black/20 backdrop-blur-md border border-white/30 text-center w-full h-full max-w-xl"
            >
              <div className="mb-4 gap-0">
                <h1 className="text-2xl font-bold text-white">
                  {user?.name.first + ' ' + user?.name.middle + user?.name.last || t('qrcode.yourName')}
                </h1>
                <p className="font-semibold text-white/80">
                  {t('qrcode.studentId')}: {user?.username || '680000000000'}
                </p>
              </div>
              <QRCodeCanvas
                ref={canvasRef}
                bgColor="transparent"
                fgColor="#ffffff"
                size={200}
                value={user?.username ?? ''}
              />
              <div className="mt-4 text-center px-4">
                <p className="text-sm font-bold text-white">
                  {t('qrcode.showBeforeJoin')}
                </p>
                <Button
                  className="bg-white text-black font-bold px-4 py-2 mt-4"
                  radius="full"
                  onPress={handleDownload}
                >
                  <Save className="mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-xl flex flex-col items-center justify-center gap-4 bg-black/20 rounded-2xl p-4 border border-white/30 min-h-[400px] shadow-lg backdrop-blur-md">
              <div className="w-full flex flex-col items-center justify-center">
                <QrScanner
                  onScan={(codes: any[]) => {
                    if (!codes || codes.length === 0) {
                      setScanResult(t('qrcode.notFound'));
                      return;
                    }
                    const result = codes[0]?.rawValue || codes[0]?.value || '';
                    if (result) {
                      handleBarcodeScanned(result);
                    } else {
                      setScanResult(t('qrcode.notFound'));
                    }
                  }}
                  constraints={{ facingMode: 'environment' }}
                  components={{ finder: false, tracker: CustomFinderTracker, zoom: true }}
                  styles={{ container: { width: '100%', height: '15rem', borderRadius: '0.75rem', overflow: 'hidden' } }}
                  sound={false}
                />
              </div>
              <div className="mt-2 text-center min-h-[2rem]">
                {scanResult ? (
                  <span className="text-white font-bold">{t('qrcode.result')}: {scanResult}</span>
                ) : (
                  <span className="text-white/60">{t('qrcode.pleaseScan')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
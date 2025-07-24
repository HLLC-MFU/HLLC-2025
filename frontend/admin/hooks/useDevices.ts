import { useEffect, useState } from 'react';
import { addToast } from '@heroui/react';
import { apiRequest } from '@/utils/api';

export interface Device {
  _id: string;
  deviceId: string;
  userId: string;
  appVersion: string;
  brand: string;
  buildNumber: string;
  createdAt: string;
  fcmToken: string;
  language: string;
  osName: string;
  osVersion: string;
  platform: string;
  updatedAt: string;
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<Device[]>('/devices', 'GET');

      if (!res.data || !Array.isArray(res.data)) {
        throw new Error('Unexpected or null response format');
      }

      const parsedDevices = res.data.map((device) => ({
        ...device,
        createdAt: new Date(device.createdAt).toISOString(),
        updatedAt: new Date(device.updatedAt).toISOString(),
      }));

      setDevices(parsedDevices);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to fetch devices'
          : 'Failed to fetch devices';

      setError(message);

      addToast({
        title: 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้',
        description: message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
  };
}

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useDeviceInfo } from '../useDeviceInfo';
import { apiRequest } from '@/utils/api';
import { useDeviceStore } from '@/stores/useDeviceStore';

// Platform-specific health data hook selector
const useHealthDataForPlatform = Platform.select({
  ios: () => require('./useHealthKitData').default,
  android: () => require('./useHealthConnectData').default,
  default: () => (date: Date) => ({ steps: 0 }),
})();

// Types
type StepCounter = {
  steps: number;
  deviceId: string;
  completeStatus: boolean;
};

// Used for static async fetching if needed outside hooks
export async function getHealthData(date: Date): Promise<{ steps: number }> {
  const fetchData = await useHealthDataForPlatform(date);
  return fetchData;
}

// Main hook for component usage
const useHealthData = (
  date: Date
): { steps: number; deviceMismatch: boolean } => {
  const [deviceMismatch, setDeviceMismatch] = useState(false);
  const { uniqueId } = useDeviceInfo();
  const { version } = useDeviceStore();

  useEffect(() => {
    if (!uniqueId) return; 
    const fetchAndValidateDevice = async () => {
      const response = await apiRequest<StepCounter[]>('/step-counters', 'GET');
      if (
        response.statusCode === 404 &&
        response.message === 'No step counters registered for this user'
      ) {
        await apiRequest('/step-counters/device', 'POST', {
          deviceId: uniqueId,
        });
        setDeviceMismatch(false);
      } else if (response.statusCode === 200 && response.data) {
        const matchFound = response.data.some(
          (record) => record.deviceId === uniqueId
        );
        console.log(`Device match found: ${matchFound}`);
        setDeviceMismatch(!matchFound);
      }
    };

    fetchAndValidateDevice();
  }, [uniqueId, version]);

  const { steps } = useHealthDataForPlatform(date);

  return { steps, deviceMismatch };
};

// Hook to update device ID
export const useUpdateDevice = () => {
  const { refreshDevice } = useDeviceStore();
  const { uniqueId } = useDeviceInfo();
  const updateDevice = async () => {
    const response = await apiRequest('/step-counters/device', 'PATCH', {
      deviceId: uniqueId,
    });
    if (response.statusCode !== 200) {
      throw new Error('Failed to update device');
    }
    refreshDevice();
  };

  return { updateDevice };
};

export default useHealthData;

export async function fetchHealthData(date: Date): Promise<{ steps: number }> {
  try {
    if (Platform.OS === 'ios') {
      const { fetchStepsFromHealthKit } = await import('./useHealthKitData');
      return await fetchStepsFromHealthKit(date);
    } else if (Platform.OS === 'android') {
      const { fetchStepsFromHealthConnect } = await import('./useHealthConnectData');
      return await fetchStepsFromHealthConnect(date);
    } else {
      return { steps: 0 };
    }
  } catch (error) {
    console.warn('[fetchHealthData] failed:', error);
    return { steps: 0 };
  }
}

import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Platform } from 'react-native';
import { useDeviceInfo } from '../useDeviceInfo';

const useHealthDataForPlatform = Platform.select({
  ios: () => require('./useHealthKitData').default,
  android: () => require('./useHealthConnectData').default,
  default: () => (date: Date) => ({ steps: 0 }),
})();

type StepCounter = {
  steps: number;
  deviceId: string;
  completeStatus: boolean;
};

const useHealthData = (date: Date): { steps: number; deviceMismatch: boolean } => {
  const [deviceMismatch, setDeviceMismatch] = useState(false);
  const { uniqueId } = useDeviceInfo();

  useEffect(() => {
    const healthDevice = async () => {
      const fetchDevice = await apiRequest<StepCounter[]>('/step-counters', 'GET');

      if (
        fetchDevice.statusCode === 404 &&
        fetchDevice.message === 'No step counters registered for this user'
      ) {
        await apiRequest('/step-counters/device', 'POST', {
          deviceId: uniqueId,
        });
      } else if (fetchDevice.statusCode === 200 && fetchDevice.data) {
        if (uniqueId !== fetchDevice.data[0].deviceId) {
          setDeviceMismatch(true);
        }
      }
    };

    healthDevice();
  }, [uniqueId]);

  const { steps } = useHealthDataForPlatform(date);

  return { steps, deviceMismatch };
};

export default useHealthData;

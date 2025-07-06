import { useEffect, useState } from 'react';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

/** React hook: use inside components */
export const useHealthKitData = (date: Date) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [steps, setSteps] = useState(0);

  const fetchHealthKitData = () => {
    if (!hasPermission) return;

    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    AppleHealthKit.getStepCount(options, (err, result) => {
      if (!err && result) setSteps(result.value);
    });
  };

  useEffect(() => {
    AppleHealthKit.isAvailable((err, available) => {
      if (err || !available) return;
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (!err) setHasPermission(true);
        else console.error('HealthKit init failed:', err);
      });
    });
  }, []);

  useEffect(() => {
    fetchHealthKitData();
    const interval = setInterval(fetchHealthKitData, 15000);
    return () => clearInterval(interval);
  }, [hasPermission, date]);

  return { steps };
};

/** Async static fetch function: use anywhere (no hooks!) */
export async function fetchStepsFromHealthKit(date: Date): Promise<{ steps: number }> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.isAvailable((err, available) => {
      if (err || !available) return reject(new Error('HealthKit not available'));
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) return reject(new Error('HealthKit init failed'));
        const options: HealthInputOptions = {
          date: date.toISOString(),
          includeManuallyAdded: false,
        };
        AppleHealthKit.getStepCount(options, (err, result) => {
          if (err || !result) return reject(new Error('Failed to get steps'));
          resolve({ steps: result.value });
        });
      });
    });
  });
}

export default useHealthKitData;

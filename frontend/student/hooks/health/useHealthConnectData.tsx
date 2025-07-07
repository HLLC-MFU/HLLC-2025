import { useEffect, useState } from 'react';
import {
  initialize,
  requestPermission,
  readRecords,
  Permission,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';
import { StepsRecord } from 'react-native-health-connect';

/** React hook: use inside components */
export const useHealthConnectData = (date: Date) => {
  const [steps, setSteps] = useState(0);

  const fetchHealthConnectData = async () => {
    try {
      const isInitialized = await initialize();
      if (!isInitialized) return;

      const permissions: Permission[] = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
      ]);
      if (permissions.length === 0) return;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const timeRangeFilter: TimeRangeFilter = {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      };

      const stepResult = await readRecords('Steps', { timeRangeFilter });
      const totalSteps = stepResult.records
        ?.map(record => record as StepsRecord)
        .reduce((sum, record) => sum + record.count, 0) ?? 0;
      setSteps(totalSteps);
    } catch {
      setSteps(0);
    }
  };

  useEffect(() => {
    fetchHealthConnectData();
    const interval = setInterval(fetchHealthConnectData, 15000);
    return () => clearInterval(interval);
  }, [date]);

  return { steps };
};

/** Async static fetch function: use anywhere (no hooks!) */
export async function fetchStepsFromHealthConnect(date: Date): Promise<{ steps: number }> {
  try {
    const isInitialized = await initialize();
    if (!isInitialized) throw new Error('Health Connect not initialized');

    const permissions = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
    ]);
    if (permissions.length === 0) throw new Error('No permissions');

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    const stepResult = await readRecords('Steps', { timeRangeFilter });

    const steps = stepResult.records
      ?.map(record => record as StepsRecord)
      .reduce((sum, record) => sum + record.count, 0) ?? 0;

    return { steps };
  } catch (error) {
    console.warn('[HealthConnect] Static fetch failed:', error);
    return { steps: 0 };
  }
}

export default useHealthConnectData;

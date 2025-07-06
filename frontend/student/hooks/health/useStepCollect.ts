import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { apiRequest } from '@/utils/api';
import { getDeviceUniqueId } from '../useDeviceInfo';
import { fetchStepsFromHealthKit } from './useHealthKitData';
import { fetchStepsFromHealthConnect } from './useHealthConnectData';
import { Platform } from 'react-native';

const BACKGROUND_TASK_IDENTIFIER = 'background-step-sync';

// Platform-safe static step fetcher
async function fetchStepsStatically(date: Date): Promise<{ steps: number }> {
  if (Platform.OS === 'ios') {
    return await fetchStepsFromHealthKit(date);
  } else if (Platform.OS === 'android') {
    return await fetchStepsFromHealthConnect(date);
  } else {
    return { steps: 0 };
  }
}

// Background-safe function
async function syncSteps() {
  try {
    const date = new Date();
    const { steps } = await fetchStepsStatically(date);
    const deviceId = await getDeviceUniqueId();
    console.log('[StepSync] Syncing steps:', { steps, deviceId, date }, 'ISO:', date.toISOString());
    let res = await apiRequest('/step-counters/sync', 'POST', {
      stepCount: steps,
      deviceId,
      date: date.toISOString(),
    });

        // If 404, register device and retry
    if (res.statusCode === 404 && res.message?.includes('Step counter not found')) {
      console.log('[StepSync] Step counter not found — trying to register device');

      // Register the device
      const registerDevice =await apiRequest('/step-counters/device', 'POST', {
        deviceId,
      });
      console.log('[StepSync] Device registered:', registerDevice);

      // Retry sync
      res = await apiRequest('/step-counters/sync', 'POST', {
        stepCount: steps,
        deviceId,
        date: date.toISOString(),
      });
    }

    console.log('[StepSync] Success', res);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[StepSync] Failed', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}

// Define task for background execution
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
  return await syncSteps();
});

// Register background task
export async function registerBackgroundTaskAsync() {
  return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
    minimumInterval: 60 * 15, // every 15 minutes
  });
}

// Optional: Call manually on startup if needed
export async function syncStepsOnStartup() {
  await syncSteps();
}

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { apiRequest } from '@/utils/api';
import { getDeviceUniqueId } from '../useDeviceInfo';
import { getHealthData } from './useHealthData';

const BACKGROUND_TASK_IDENTIFIER = 'background-step-sync';
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    try {
        const { steps } = await getHealthData(new Date());
        const deviceId = getDeviceUniqueId();

        await apiRequest('/step-counters/sync', 'POST', {
            steps,
            deviceId,
            date: new Date().toISOString(),
        });

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        console.error('[BackgroundTask] Step sync error', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export async function registerBackgroundTaskAsync() {
  return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
    minimumInterval: 60 * 60, // 1 hour
  });
}
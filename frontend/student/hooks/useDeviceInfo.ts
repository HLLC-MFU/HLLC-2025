import { create } from 'zustand';
import { useEffect } from 'react';
import DeviceInfo from 'react-native-device-info';

interface DeviceStore {
  uniqueId: string | null;
  fetchUniqueId: () => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  uniqueId: null,
  fetchUniqueId: async () => {
    const id = await DeviceInfo.getUniqueId();
    set({ uniqueId: id });
  },
}));

export function useDeviceInfo() {
  const uniqueId = useDeviceStore((state) => state.uniqueId);
  const fetchUniqueId = useDeviceStore((state) => state.fetchUniqueId);

  useEffect(() => {
    fetchUniqueId();
  }, [fetchUniqueId]);

  return { uniqueId };
}

export async function getDeviceUniqueId(): Promise<string> {
  return await DeviceInfo.getUniqueId(); // ✅ Direct, no hooks
}
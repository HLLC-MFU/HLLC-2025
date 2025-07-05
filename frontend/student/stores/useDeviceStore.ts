import { create } from 'zustand';

type DeviceState = {
  version: number; // used to trigger refresh
  refreshDevice: () => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  version: 0,
  refreshDevice: () => set((state) => ({ version: state.version + 1 })),
}));

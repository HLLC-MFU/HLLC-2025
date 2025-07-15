export type Device = {
  deviceId: string;
  fcmToken: string;
  platform: string;
  language: string;
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
}
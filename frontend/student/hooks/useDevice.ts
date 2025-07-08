import { useLanguage } from "@/context/LanguageContext";
import { Device } from "@/types/device";
import { apiRequest } from "@/utils/api";
import { getToken, saveToken } from "@/utils/storage";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import DeviceInfo from 'react-native-device-info';

const DEVICE_ID_KEY = 'deviceId';
const TOKEN_KEY = 'fcmToken';

export default function useDevice() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { language } = useLanguage();

	const getStoredDeviceId = useCallback(async (): Promise<string> => {
		let deviceId = await getToken(DEVICE_ID_KEY);
		if (!deviceId) {
			deviceId = await DeviceInfo.syncUniqueId()
			await saveToken(DEVICE_ID_KEY, deviceId);
		}
		return deviceId;
	}, []);

	const getDeviceInfo = useCallback(async () => {
		const id = await getStoredDeviceId();

		return {
			deviceId: id,
			fcmToken: await getToken(TOKEN_KEY),
			platform: Platform.OS,
			osName: DeviceInfo.getSystemName(),
			osVersion: DeviceInfo.getSystemVersion(),
			brand: DeviceInfo.getBrand(),
			language: language,
			appVersion: DeviceInfo.getVersion(),
  			buildNumber: DeviceInfo.getBuildNumber(),  
		};
	}, [getStoredDeviceId]);

	const registerDevice = useCallback(async () => {
		try {
			setLoading(true);

			const deviceInfo = await getDeviceInfo();

			if (!deviceInfo.fcmToken) {
				throw new Error('Please turn on app notification');
			}

			const res = await apiRequest<{ data: Device }>(`/devices/register`, 'POST', deviceInfo);

			if (res.statusCode !== 201) {
				throw new Error(res.message || 'Failed to register device.');
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to register device.');
		} finally {
			setLoading(false);
		}
	}, [getDeviceInfo]);

	const revokeDevice = async (deviceId: String) => {
		try {
			setLoading(true);
			const res = await apiRequest(`/devices/revoke/${deviceId}`, 'DELETE');

			if (res.statusCode !== 204) {
				throw new Error(res.message || 'Failed to revoke device.');
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to revoke device.');
		} finally {
			setLoading(false);
		}
	};

	return {
		loading,
		error,
		registerDevice,
		revokeDevice,
		getDeviceInfo
	};
};
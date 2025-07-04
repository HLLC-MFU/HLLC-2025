import { Device } from "@/types/device";
import { apiRequest } from "@/utils/api";
import { useState } from "react";

export default function useDevice() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const registerDevice = async (DeviceData: Device) => {
		try {
			setLoading(true);
			const res = await apiRequest<{ data: Device }>(`/devices/register`, 'POST', DeviceData);

			if (res.statusCode !== 201) {
				throw new Error(res.message || 'Failed to create notification.');
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to register device.');
		} finally {
			setLoading(false);
		}
	};

	const revokeDevice = async (deviceId: String) => {
		try {
			setLoading(true);
			const res = await apiRequest(`/devices/revoke${deviceId}`, 'DELETE');

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
		revokeDevice
	};
};
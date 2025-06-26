import { LamduanSetting } from "@/types/lamduan-flowers";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

export function useLamduanSetting() {
    const [lamduanSetting, setLamduanSetting] = useState<LamduanSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);

    const fetchLamduanSetting = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: LamduanSetting[] }>("/lamduan-setting?limit=0", "GET");

            setLamduanSetting(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch lamduan setting.'
                    : 'Failed to fetch lamduan setting.',
            );
        } finally {
            setLoading(false);
        }
    };

    const createLamduanSetting = async (settingData: FormData) => {
        try {
            setLoading(true);

            const res = await apiRequest<LamduanSetting>('/lamduan-setting', 'POST' , settingData);

            if(res.data) {
                setLamduanSetting((prev) => [...prev, res.data as LamduanSetting]);
                addToast({ 
                    title: "Setting created successfully", 
                    color: "success" });
            }
            return res;
        } catch (err : any) {
            setError(err.message || 'Failed to update lamduan setting.');
        } finally {
            setLoading(false);
        }
    };

    const updateLamduanSetting = async (
        id: string,
        lamduanSettingData: FormData,
    ): Promise<void> => {
        if (!id) {
            console.error("Invalid setting ID");
            return;
        }

        lamduanSettingData.delete('_id');

        try {
            setLoading(true);
            const res = await apiRequest<LamduanSetting>(
                `/lamduan-setting/${id}`,
                'PATCH',
                lamduanSettingData,
            );

            if (res.data) {
                setLamduanSetting((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
                addToast({
                    title: 'Setting updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update setting.');
        } finally {
            setLoading(false);
        }
    };

    const deleteLamduanSetting = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/lamduan-setting/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setLamduanSetting((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'Lamduan setting deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete lamduan setting.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete lamduan setting.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLamduanSetting();
    }, []);

    return {
        lamduanSetting,
        loading,
        error,
        createLamduanSetting,
        updateLamduanSetting,
        fetchLamduanSetting,
        deleteLamduanSetting,
    };
}
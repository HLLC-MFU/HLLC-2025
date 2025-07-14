import { addToast } from '@heroui/react';
import { useEffect, useState } from 'react';

import { Appearance } from '@/types/appearance';
import { apiRequest } from '@/utils/api';

export default function useAppearance({
  appearance,
}: {
  appearance: Appearance | null;
}) {
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveColor = async () => {
    const formData = new FormData();

    if (appearance && appearance.school && appearance.school._id) {
      formData.append('school', appearance.school._id);
    }
    Object.entries(colors).forEach(([key, value]) => {
      formData.append(`colors[${key.toLowerCase()}]`, value);
    });

    return await updateAppearance(formData);
  };

  const handleSaveAsset = async () => {
    const formData = new FormData();

    if (appearance && appearance.school && appearance.school._id) {
      formData.append('school', appearance.school._id);
    }
    Object.entries(assets).forEach(([key, file]) => {
      formData.append(`assets[${key.toLowerCase()}]`, file);
    });
    
    return await updateAppearance(formData);
  };

  const fetchAppearances = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ data: Appearance[] }>(
        '/appearances',
        'GET',
      );

      setAppearances(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch appearance.'
          : 'Failed to fetch appearance.',
      );
    }
    setLoading(false);
  };

  const fetchAppearancesById = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ data: Appearance[] }>(
        `/appearances/${id}`,
        'GET',
      );

      setAppearances(Array.isArray(res.data?.data) ? res.data.data : []);

      return res.data;
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to fetch appearance.'
          : 'Failed to fetch appearance.',
      );
    }
    setLoading(false);
  };

  const createAppearance = async (appearanceFormData: FormData) => {
    try {
      setLoading(true);
      const res = await apiRequest<Appearance>(
        '/appearances',
        'POST',
        appearanceFormData,
      );

      if (res.data) {
        await new Promise((resolve) => {
          setAppearances((prev) => {
            const update = [...prev, res.data as Appearance];

            resolve(update);

            return update;
          });
        });
      }
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to create appearance.'
          : 'Failed to create appearance.',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAppearance = async (appearanceFormData: FormData) => {
    try {
      setLoading(true);
      const res = await apiRequest<Appearance>(
        `/appearances/${appearance?._id}`,
        'PATCH',
        appearanceFormData,
      );

      if (res.data) {
        setAppearances((prev) =>
          prev.map((s) => (s._id === appearance?._id ? res.data! : s)),
        );
        setAssets({});
        addToast({
          title: 'Appearance updated successfully',
          color: 'success',
        });
      }

      return res.data;
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to update appearance.'
          : 'Failed to update appearance.',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteAppearance = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/appearances/${id}`, 'DELETE');

      if (res.statusCode !== 200) {
        throw new Error(res.message || 'Failed to delete appearance.');
      } else {
        setAppearances((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message ||
              'Failed to delete appearance.'
          : 'Failed to delete appearance.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppearances();
    setColors({
      primary: appearance?.colors?.primary ?? '#ffffff',
      secondary: appearance?.colors?.secondary ?? '#ffffff',
    });
  }, [appearance]);

  return {
    appearances,
    colors,
    assets,
    loading,
    error,
    setError,
    setAssets,
    fetchAppearances,
    fetchAppearancesById,
    createAppearance,
    updateAppearance,
    deleteAppearance,
    handleSaveColor,
    handleSaveAsset,
  };
}

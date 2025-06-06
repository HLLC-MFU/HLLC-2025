import { useState, useEffect } from 'react';
import { Appearance } from '@/types/appearance';

interface UseAppearanceColorsProps {
    appearance: Appearance | null;
}

export function useAppearanceColors({ appearance }: UseAppearanceColorsProps) {
    const [colorDrafts, setColorDrafts] = useState<Record<string, string>>({
        primary: appearance?.colors.primary ?? "#3b82f6",
        secondary: appearance?.colors.secondary ?? "#8b5cf6",
    });

    const handleColorChange = (key: string, value: string) => {
        setColorDrafts(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveColors = async () => {
        if (!appearance) return;

        try {
            const formData = new FormData();
            if (appearance.school && appearance.school._id) {
                formData.append('school', appearance.school._id);
            }
            Object.entries(colorDrafts).forEach(([key, value]) => {
                formData.append(`colors[${key}]`, value);
            });

            const res = await fetch(`http://localhost:8080/api/appearances/${appearance._id}`, {
                method: "PATCH",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${text}`);
            }

            const json = await res.json();
            if (Array.isArray(json.data)) {
                return json.data[0];
            }
            return json.data;
        } catch (err) {
            console.error("Error saving colors:", err);
            throw err;
        }
    };

    useEffect(() => {
        if (appearance?.colors) {
            setColorDrafts({
                primary: appearance.colors.primary,
                secondary: appearance.colors.secondary,
            });
        }
    }, [appearance]);

    return {
        colorDrafts,
        handleColorChange,
        handleSaveColors,
    };
} 
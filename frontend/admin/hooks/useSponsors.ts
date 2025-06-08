import { Sponsors } from "@/types/sponsors";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

export function useSponsors() {
    const [sponsors, setSponsors] = useState<Sponsors[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)

    // Fetch all sponsors
    const fetchSponsors = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Sponsors[] }>("/sponsors?limit=0", "GET");

            setSponsors(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch sponsors.'
                    : 'Failed to fetch sponsors.',
            );
        } finally {
            setLoading(false);
        }
    };

    // Create sponsor
    const createSponsors = async (sponsorsData: Partial<Sponsors> | FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<Sponsors>("/sponsors", "POST", sponsorsData);
            console.log("Create response: ", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setSponsors((prev) => {
                        const updated = [...prev, res.data as Sponsors];
                        resolve(updated);
                        return updated;
                    });
                });
            }
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create sponsors.'
                    : 'Failed to create sponsors.',
            );
        } finally {
            setLoading(false);
        }
    };

    const updateSponsors = async (
		id: string,
		sponsorsData: Partial<Sponsors> | FormData,
	): Promise<void> => {
		try {
			setLoading(true);
			const res = await apiRequest<Sponsors>(
				`/sponsors/${id}`,
				'PATCH',
				sponsorsData,
			);

			if (res.data) {
				setSponsors((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
				addToast({
					title: 'Sponsors updated successfully!',
					color: 'success',
				});
			}
		} catch (err: any) {
			setError(err.message || 'Failed to update sponsors.');
		} finally {
			setLoading(false);
		}
	};

    const deleteSponsors = async (id: string): Promise<void> => {
		try {
			setLoading(true);
			const res = await apiRequest(`/sponsors/${id}`, 'DELETE');

			if (res.statusCode === 200) {
				setSponsors((prev) => prev.filter((s) => s._id !== id));
				addToast({
					title: 'Sponsors deleted successfully!',
					color: 'success',
				});
			} else {
				throw new Error(res.message || 'Failed to delete sponsors.');
			}
		} catch (err: any) {
			setError(err.message || 'Failed to delete sponsors.');
		} finally {
			setLoading(false);
		}
	};

    useEffect(() => {
        fetchSponsors();
    }, []);

    return {
        sponsors,
        loading,
        error,
        fetchSponsors,
        createSponsors,
        updateSponsors,
        deleteSponsors,
    };
}
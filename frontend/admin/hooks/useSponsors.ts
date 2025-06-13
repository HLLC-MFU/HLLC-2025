import { Sponsors } from "@/types/sponsors";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const createSponsors = async (sponsorData: FormData) => {
    try {
      setLoading(true);

      const res = await apiRequest<Sponsors>('/sponsors', 'POST', sponsorData);

      if (res.data) {
        setSponsors((prev) => [...prev, res.data as Sponsors]);
        addToast({
          title: 'Sponsors add successfully!',
          color: 'success',
        });
      }

      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to create sponsors type.');
    } finally {
      setLoading(false);
    }
  };

  const updateSponsors = async (
    id: string,
    sponsorsData: FormData,
  ): Promise<void> => {
    if (!id) {
      console.error("Invalid sponsor ID");
      return;
    }

    // Optionally remove _id from FormData
    sponsorsData.delete('_id'); // Prevent conflict if _id is present but empty

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
          title: 'Sponsors type updated successfully!',
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
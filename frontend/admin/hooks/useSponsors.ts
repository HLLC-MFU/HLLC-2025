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

      const res = await fetch(`${API_BASE_URL}/sponsors`, {
        method: "POST",
        body: sponsorData,
        credentials: "include"
      });
      const data = await res.json();
      console.log("Create response:", res, data);

      if (data && '_id' in data) {
        setSponsors((prev) => [...prev, data]);
      }

      return res;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to create evouchers.'
          : 'Failed to create sponsors.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateSponsors = async (
    id: string,
    sponsorsData: FormData,
  ): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/sponsors/${id}`, {
        method: 'PATCH',
        body: sponsorsData,
        credentials: "include"
      });
      const data = await res.json();
      console.log("Update response:", res, data);

      if (data) {
        setSponsors((prev) => prev.map((s) => (s._id === id ? data! : s)));
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
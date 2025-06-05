import { Sponsor, Type } from "@/types/sponsor";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

type SponsorType = { _id: string; name: string };

export function useSponsor() {
    const [sponsor, setSponsor] = useState<Sponsor[]>([]);
    const [sponsorTypes, setSponsorTypes] = useState<SponsorType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSponsors = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching sponsors and types');
            const [sponsorRes, typesRes] = await Promise.all([
                apiRequest<{ data: Sponsor[] }>(
                    '/sponsors',
                    'GET',
                    undefined,
                    {
                        credentials: 'include',
                    }
                ),
                apiRequest<{ data: Type[] }>(
                    '/sponsors-type',
                    'GET',
                    undefined,
                    {
                        credentials: 'include',
                    }
                ),
            ]);

            // console.log('Sponsor response:', sponsorRes);
            // console.log('Sponsor type response', typesRes);

            if (sponsorRes.data?.data) {
                setSponsor(sponsorRes.data.data);
                // console.log('Sponsor set: ', sponsorRes.data.data);
            }

            if (typesRes.data?.data) {
                setSponsorTypes(typesRes.data.data);
                // console.log('Sponsor type set: ', typesRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching data: ', err);
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch data.'
                : 'Failed to fetch data.';

            if (err && typeof err === 'object' && 'statusCode' in err && (err as any).statusCode === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            setError(errorMessage);
            addToast({
                title: 'Failed to fetch sponsors and types',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const createSponsor = async (formData: FormData): Promise<void> => {
        try {
            setLoading(true);
            console.log('Creating sponsor with form data');

            formData.forEach((value, key) => {
                console.log(`${key}:`, value);
            });

            const response = await fetch("http://localhost:8080/api/sponsors", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const newSponsor: Sponsor = await response.json();

            await fetchSponsors();

            addToast({
                title: "Sponsor created successfully!",
                color: "success",
            });
        } catch (err: any) {
            console.error("Error creating sponsor:", err);
            const errorMessage = err.message || "Failed to create sponsor.";
            setError(errorMessage);
            addToast({
                title: "Failed to create sponsor",
                description: errorMessage,
                color: "danger",
            });
        } finally {
            setLoading(false);
        }
    };


    const updateSponsor = async (
        id: string,
        formData: FormData,
    ): Promise<void> => {
        try {
            setLoading(true);

            const response = await fetch(`http://localhost:8080/api/sponsors/${id}`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include', // สำคัญถ้าใช้ cookie auth
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to update sponsor');
            }

            const updatedSponsor: Sponsor = await response.json();

            setSponsor((prev) =>
                prev.map((s) => (s._id === id ? updatedSponsor : s))
            );
            
            addToast({
                title: 'Sponsor updated successfully!',
                color: 'success',
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update sponsor.';
            setError(errorMessage);
            addToast({
                title: 'Failed to update sponsor',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };


    const deleteSponsor = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/sponsors/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setSponsor((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'Sponsor deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete sponsor');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete sponsor.');
        } finally {
            setLoading(false);
        }
    };

    const deleteSponsorType = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/sponsors-type/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setSponsor((prev) => prev.filter((s) => s._id !== id));
                addToast({
                    title: 'Sponsor type deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete sponsor type');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete sponsor type.');
        } finally {
            setLoading(false);
        }
    };

    const createSponsortype = async (typeData: Partial<SponsorType>): Promise<void> => {
        try {
            setLoading(true);
            console.log(typeData)
            const res = await apiRequest<SponsorType>(
                '/sponsors-type',
                'POST',
                typeData,
            );

            if (res.data) {
                setSponsorTypes((prev) => [...prev, res.data as SponsorType]);
                addToast({
                    title: 'Sponsor type created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to create sponosr type.';
            setError(errorMessage);
            addToast({
                title: 'Failed to create sponsor type',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const updateSponsorType = async (
        id: string,
        typeData: Partial<SponsorType>,
    ): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest<SponsorType>(
                `/sponsors-type/${id}`,
                'PATCH',
                typeData,
                {
                    credentials: 'include',
                }
            );

            if (res.data) {
                setSponsorTypes((prev) => prev.map((t) => (t._id === id ? res.data! : t)));
                addToast({
                    title: 'Sponsor type updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update sponsor type.';
            setError(errorMessage);
            addToast({
                title: 'Failed to update sponsor type',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    return {
        sponsor,
        sponsorTypes,
        loading,
        error,
        fetchSponsors,
        createSponsor,
        updateSponsor,
        deleteSponsor,
        createSponsortype,
        updateSponsorType,
        deleteSponsorType,
    };
}
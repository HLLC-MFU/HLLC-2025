import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';

import { Activities, ActivityType } from '@/types/activities';
import { apiRequest } from '@/utils/api';

export function useActivities() {
    const [activities, setActivities] = useState<Activities[]>([]);
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all activities and activity types from the API.
     * This function retrieves the list of activities and activity types and updates the state.
     * limit=0 is used to fetch all items without pagination.
     * @return {Promise<void>} A promise that resolves when the data is fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const fetchActivities = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching activities and types...');
            const [activitiesRes, typesRes] = await Promise.all([
                apiRequest<{ data: Activities[] }>(
                    '/activities?limit=0',
                    'GET',
                    undefined,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                ),
                apiRequest<{ data: ActivityType[] }>(
                    '/activities-type?limit=0',
                    'GET',
                    undefined,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                ),
            ]);

            console.log('Activities response:', activitiesRes);
            console.log('Activity types response:', typesRes);

            if (activitiesRes.data?.data) {
                setActivities(activitiesRes.data.data);
                console.log('Activities set:', activitiesRes.data.data);
            }

            if (typesRes.data?.data) {
                setActivityTypes(typesRes.data.data);
                console.log('Activity types set:', typesRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
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
                title: 'Failed to fetch activities and types',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new activity with the provided data.
     * This function sends a POST request to the API to create a new activity.
     * @param {Partial<Activities>} activityData - The data for the new activity.
     * @return {Promise<void>} A promise that resolves when the activity is created.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const createActivity = async (activityData: Partial<Activities>): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        try {
            setLoading(true);
            console.log('Creating activity with data:', activityData);

            const res = await apiRequest<Activities>(
                '/activities',
                'POST',
                activityData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            console.log('Create activity response:', res);

            if (res.data) {
                setActivities((prev) => [...prev, res.data as Activities]);
                console.log('Activity created:', res.data);
                addToast({
                    title: 'Activity created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            console.error('Error creating activity:', err);
            const errorMessage = err.message || 'Failed to create activity.';

            if (err.statusCode === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            setError(errorMessage);
            addToast({
                title: 'Failed to create activity',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates an existing activity with the provided data.
     * This function sends a PATCH request to the API to update the activity.
     * @param {string} id - The ID of the activity to update.
     * @param {Partial<Activities>} activityData - The data to update the activity with.
     * @return {Promise<void>} A promise that resolves when the activity is updated.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const updateActivity = async (
        id: string,
        activityData: Partial<Activities>,
    ): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            return;
        }

        try {
            setLoading(true);
            const res = await apiRequest<Activities>(
                `/activities/${id}`,
                'PATCH',
                activityData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (res.data) {
                setActivities((prev) => prev.map((a) => (a._id === id ? res.data! : a)));
                addToast({
                    title: 'Activity updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update activity.';
            setError(errorMessage);
            addToast({
                title: 'Failed to update activity',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes an activity by its ID.
     * This function sends a DELETE request to the API to remove the activity.
     * @param {string} id - The ID of the activity to delete.
     * @return {Promise<void>} A promise that resolves when the activity is deleted.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const deleteActivity = async (id: string): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            return;
        }

        try {
            setLoading(true);
            const res = await apiRequest(`/activities/${id}`, 'DELETE', undefined, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (res.statusCode === 200) {
                setActivities((prev) => prev.filter((a) => a._id !== id));
                addToast({
                    title: 'Activity deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete activity.');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to delete activity.';
            setError(errorMessage);
            addToast({
                title: 'Failed to delete activity',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new activity type with the provided data.
     * This function sends a POST request to the API to create a new activity type.
     * @param {Partial<ActivityType>} typeData - The data for the new activity type.
     * @return {Promise<void>} A promise that resolves when the activity type is created.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const createActivityType = async (typeData: Partial<ActivityType>): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            return;
        }

        try {
            setLoading(true);
            const res = await apiRequest<ActivityType>(
                '/activities-type',
                'POST',
                typeData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (res.data) {
                setActivityTypes((prev) => [...prev, res.data as ActivityType]);
                addToast({
                    title: 'Activity type created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to create activity type.';
            setError(errorMessage);
            addToast({
                title: 'Failed to create activity type',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates an existing activity type with the provided data.
     * This function sends a PATCH request to the API to update the activity type.
     * @param {string} id - The ID of the activity type to update.
     * @param {Partial<ActivityType>} typeData - The data to update the activity type with.
     * @return {Promise<void>} A promise that resolves when the activity type is updated.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const updateActivityType = async (
        id: string,
        typeData: Partial<ActivityType>,
    ): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            return;
        }

        try {
            setLoading(true);
            const res = await apiRequest<ActivityType>(
                `/activities-type/${id}`,
                'PATCH',
                typeData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (res.data) {
                setActivityTypes((prev) => prev.map((t) => (t._id === id ? res.data! : t)));
                addToast({
                    title: 'Activity type updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update activity type.';
            setError(errorMessage);
            addToast({
                title: 'Failed to update activity type',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes an activity type by its ID.
     * This function sends a DELETE request to the API to remove the activity type.
     * @param {string} id - The ID of the activity type to delete.
     * @return {Promise<void>} A promise that resolves when the activity type is deleted.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const deleteActivityType = async (id: string): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            localStorage.removeItem('token');
            return;
        }

        try {
            setLoading(true);
            const res = await apiRequest(`/activities-type/${id}`, 'DELETE', undefined, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (res.statusCode === 200) {
                setActivityTypes((prev) => prev.filter((t) => t._id !== id));
                addToast({
                    title: 'Activity type deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete activity type.');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to delete activity type.';
            setError(errorMessage);
            addToast({
                title: 'Failed to delete activity type',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    return {
        activities,
        activityTypes,
        loading,
        error,
        fetchActivities,
        createActivity,
        updateActivity,
        deleteActivity,
        createActivityType,
        updateActivityType,
        deleteActivityType,
    };
} 
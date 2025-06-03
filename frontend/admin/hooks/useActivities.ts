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
     * Fetch all activities from the API.
     * This function retrieves the list of activities and updates the state.
     * limit=0 is used to fetch all activities without pagination.
     * @return {Promise<void>} A promise that resolves when the activities are fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     * */
    const fetchActivities = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const [activitiesRes, typesRes] = await Promise.all([
                apiRequest<{ data: Activities[] }>(
                    '/activities?limit=0',
                    'GET',
                ),
                apiRequest<{ data: ActivityType[] }>(
                    '/activities-type?limit=0',
                    'GET',
                ),
            ]);

            setActivities(Array.isArray(activitiesRes.data?.data) ? activitiesRes.data.data : []);
            setActivityTypes(Array.isArray(typesRes.data?.data) ? typesRes.data.data : []);
        } catch (err) {
            addToast({
                title: 'Failed to fetch activities. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch activities.'
                    : 'Failed to fetch activities.',
            );
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
        try {
            setLoading(true);
            const res = await apiRequest<Activities>('/activities', 'POST', activityData);

            if (res.data) {
                setActivities((prev) => [...prev, res.data as Activities]);
                addToast({
                    title: 'Activity created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create activity.');
            addToast({
                title: 'Failed to create activity. Please try again.',
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
        try {
            setLoading(true);
            const res = await apiRequest<Activities>(
                `/activities/${id}`,
                'PATCH',
                activityData,
            );

            if (res.data) {
                setActivities((prev) => prev.map((a) => (a._id === id ? res.data! : a)));
                addToast({
                    title: 'Activity updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update activity.');
            addToast({
                title: 'Failed to update activity. Please try again.',
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
        try {
            setLoading(true);
            const res = await apiRequest(`/activities/${id}`, 'DELETE');

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
            setError(err.message || 'Failed to delete activity.');
            addToast({
                title: 'Failed to delete activity. Please try again.',
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
        try {
            setLoading(true);
            const res = await apiRequest<ActivityType>('/activities-type', 'POST', typeData);

            if (res.data) {
                setActivityTypes((prev) => [...prev, res.data as ActivityType]);
                addToast({
                    title: 'Activity type created successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create activity type.');
            addToast({
                title: 'Failed to create activity type. Please try again.',
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
        try {
            setLoading(true);
            const res = await apiRequest<ActivityType>(
                `/activities-type/${id}`,
                'PATCH',
                typeData,
            );

            if (res.data) {
                setActivityTypes((prev) => prev.map((t) => (t._id === id ? res.data! : t)));
                addToast({
                    title: 'Activity type updated successfully!',
                    color: 'success',
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update activity type.');
            addToast({
                title: 'Failed to update activity type. Please try again.',
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
        try {
            setLoading(true);
            const res = await apiRequest(`/activities-type/${id}`, 'DELETE');

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
            setError(err.message || 'Failed to delete activity type.');
            addToast({
                title: 'Failed to delete activity type. Please try again.',
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
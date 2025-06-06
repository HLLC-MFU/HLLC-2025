import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';

import { School, Major } from '@/types/school';
import { apiRequest } from '@/utils/api';

export function useSchools() {
	const [schools, setSchools] = useState<School[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Fetch all schools from the API.
	 * This function retrieves the list of schools and updates the state.
	 * limit=0 is used to fetch all schools without pagination.
	 * @return {Promise<void>} A promise that resolves when the schools are fetched.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const fetchSchools = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<{ data: School[] }>(
				'/schools?limit=0',
				'GET',
			);

			setSchools(Array.isArray(res.data?.data) ? res.data.data : []);
		} catch (err) {
			addToast({
				title: 'Failed to fetch schools. Please try again.',
				color: 'danger',
			});
			setError(
				err && typeof err === 'object' && 'message' in err
					? (err as { message?: string }).message || 'Failed to fetch schools.'
					: 'Failed to fetch schools.',
			);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * @param schoolData
	 * Creates a new school with the provided data.
	 * This function sends a POST request to the API to create a new school.
	 * @param {Partial<School>} schoolData - The data for the new school.
	 * @return {Promise<void>} A promise that resolves when the school is created.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const createSchool = async (schoolData: Partial<School>) => {
		try {
			setLoading(true);
			const res = await apiRequest<School>('/schools', 'POST', schoolData);

			if (res.data) {
				setSchools((prev) => [...prev, res.data as School]);
				addToast({
					title: 'School created successfully!',
					color: 'success',
				});
			}
		} catch (err: any) {
			setError(err.message || 'Failed to create school.');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Updates an existing school with the provided data.
	 * This function sends a PATCH request to the API to update the school.
	 * @param {string} id - The ID of the school to update.
	 * @param {Partial<School>} schoolData - The data to update the school with.
	 * @return {Promise<void>} A promise that resolves when the school is updated.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const updateSchool = async (
		id: string,
		schoolData: Partial<School>,
	): Promise<void> => {
		try {
			setLoading(true);
			const res = await apiRequest<School>(
				`/schools/${id}`,
				'PATCH',
				schoolData,
			);

			if (res.data) {
				setSchools((prev) => prev.map((s) => (s._id === id ? res.data! : s)));
				addToast({
					title: 'School updated successfully!',
					color: 'success',
				});
			}
		} catch (err: any) {
			setError(err.message || 'Failed to update school.');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Deletes a school by its ID.
	 * This function sends a DELETE request to the API to remove the school.
	 * * @param {string} id - The ID of the school to delete.
	 * @return {Promise<void>} A promise that resolves when the school is deleted.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const deleteSchool = async (id: string): Promise<void> => {
		try {
			setLoading(true);
			const res = await apiRequest(`/schools/${id}`, 'DELETE');

			if (res.statusCode === 200) {
				setSchools((prev) => prev.filter((s) => s._id !== id));
				addToast({
					title: 'School deleted successfully!',
					color: 'success',
				});
			} else {
				throw new Error(res.message || 'Failed to delete school.');
			}
		} catch (err: any) {
			setError(err.message || 'Failed to delete school.');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Adds a new major to a school.
	 * This function sends a POST request to the API to create a new major
	 * and updates the school's majors list in the state.
	 * @param {string} schoolId - The ID of the school to add the major to.
	 * @param {Partial<Major>} majorData - The data for the new major.
	 * @return {Promise<void>} A promise that resolves when the major is added.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const addMajor = async (
		schoolId: string,
		majorData: Partial<Major>,
	): Promise<void> => {
		try {
			const res = await apiRequest('/majors', 'POST', {
				...majorData,
				school: schoolId,
			});

			if (res.statusCode === 201) {
				addToast({
					title: 'Major added successfully!',
					color: 'success',
				});
			}
		} catch (err: any) {
			addToast({
				title: 'Failed to add major. Please try again.',
				color: 'danger',
			});
			setError(
				err && typeof err === 'object' && 'message' in err
					? (err as { message?: string }).message || 'Failed to add major.'
					: 'Failed to add major.',
			);
		}
	};

	/**
	 * Edits an existing major.
	 * This function sends a PATCH request to the API to update the major
	 * and updates the school's majors list in the state.
	 * @param {Partial<Major>} majorData - The data for the major to update.
	 * @return {Promise<void>} A promise that resolves when the major is updated.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const editMajor = async (majorData: Partial<Major>): Promise<void> => {
		if (!majorData._id || !majorData.school) return;
		setLoading(true); // ✅ set loading true
		try {
			const res = await apiRequest(
				`/majors/${majorData._id}`,
				'PATCH',
				majorData,
			);

			if (res.data) {
				addToast({
					title: 'Major added successfully!',
					color: 'success',
				});
				await fetchSchools();
			}
		} catch (err: any) {
			addToast({
				title: 'Failed to update major. Please try again.',
				color: 'danger',
			});
			setError(
				err && typeof err === 'object' && 'message' in err
					? (err as { message?: string }).message || 'Failed to update major.'
					: 'Failed to update major.',
			);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Deletes a major from a school.
	 * This function sends a DELETE request to the API to remove the major
	 * and updates the school's majors list in the state.
	 * @param {string} schoolId - The ID of the school from which to delete the major.
	 * @param {string} majorId - The ID of the major to delete.
	 * @return {Promise<void>} A promise that resolves when the major is deleted.
	 * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
	 * */
	const deleteMajor = async (
		schoolId: string,
		majorId: string,
	): Promise<void> => {
		setLoading(true); // ✅ set loading true
		try {
			await apiRequest(`/majors/${majorId}`, 'DELETE');
			setSchools((prev) =>
				prev.map((s) =>
					s._id === schoolId
						? {
								...s,
								majors: (s.majors ?? []).filter((m) => m._id !== majorId),
							}
						: s,
				),
			);
			addToast({
				title: 'Major deleted successfully!',
				color: 'success',
			});
		} catch (err: any) {
			addToast({
				title: 'Failed to delete major. Please try again.',
				color: 'danger',
			});
			setError(
				err && typeof err === 'object' && 'message' in err
					? (err as { message?: string }).message || 'Failed to delete major.'
					: 'Failed to delete major.',
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSchools();
	}, []);

	return {
		schools,
		loading,
		error,
		fetchSchools,
		createSchool,
		updateSchool,
		deleteSchool,
		addMajor,
		editMajor,
		deleteMajor,
	};
}

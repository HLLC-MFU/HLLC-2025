'use client';
import { useMemo, useState } from 'react';
import { addToast } from '@heroui/react';
import { SchoolIcon } from 'lucide-react';

import { SchoolList } from './_components/SchoolList';
import { SchoolFilters } from './_components/SchoolFilters';
import { SchoolModal } from './_components/SchoolModal';

import { ConfirmationModal } from '@/components/modal/ConfirmationModal';
import { useSchools } from '@/hooks/useSchool';
import { School } from '@/types/school';
import { PageHeader } from '@/components/ui/page-header';

export default function SchoolsPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<string>('name');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedSchool, setSelectedSchool] = useState<
		School | Partial<School> | undefined
	>();
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [confirmationModalType, setConfirmationModalType] = useState<
		'delete' | 'edit' | null
	>(null);

	const { schools, loading, createSchool, updateSchool, deleteSchool } =
		useSchools();

	const filteredAndSortedSchools = useMemo(() => {
		if (!schools) return [];

		let filtered = schools;

		if (searchQuery.trim() !== '') {
			const lower = searchQuery.toLowerCase();

			filtered = schools.filter(
				(s) =>
					s.name?.en?.toLowerCase().includes(lower) ||
					s.name?.th?.toLowerCase().includes(lower) ||
					s.acronym?.toLowerCase().includes(lower),
			);
		}

		return filtered.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'name':
					comparison = (a.name?.en ?? '').localeCompare(b.name?.en ?? '');
					break;
				case 'acronym':
					comparison = (a.acronym ?? '').localeCompare(b.acronym ?? '');
					break;
				case 'majors':
					comparison = (a.majors?.length ?? 0) - (b.majors?.length ?? 0);
					break;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	}, [schools, searchQuery, sortBy, sortDirection]);

	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
	};

	const handleAddSchool = () => {
		setModalMode('add');
		setSelectedSchool(undefined);
		setIsModalOpen(true);
	};

	const handleEditSchool = (school: School) => {
		setModalMode('edit');
		setSelectedSchool(school);
		setIsModalOpen(true);
	};

	const handleDeleteSchool = (school: School) => {
		setSelectedSchool(school);
		setConfirmationModalType('delete');
	};

	const handleSubmitSchool = (schoolData: Partial<School>) => {
		if (selectedSchool && ' _id' in selectedSchool && selectedSchool._id) {
			setSelectedSchool({ ...selectedSchool, ...schoolData });
			setConfirmationModalType('edit');
		} else {
			createSchool(schoolData);
			addToast({
				title: 'School added successfully!',
				color: 'success',
			});
		}
		setIsModalOpen(false);
	};

	const handleConfirm = () => {
		if (
			confirmationModalType === 'delete' &&
			selectedSchool &&
			selectedSchool._id
		) {
			deleteSchool(selectedSchool._id);
			addToast({
				title: 'School deleted successfully!',
				color: 'success',
			});
		} else if (
			confirmationModalType === 'edit' &&
			selectedSchool &&
			selectedSchool._id
		) {
			updateSchool(selectedSchool._id, selectedSchool);
			addToast({
				title: 'School updated successfully!',
				color: 'success',
			});
		}
		setConfirmationModalType(null);
		setSelectedSchool(undefined);
	};

	return (
		<>
			<PageHeader description='The is Management Page' icon={<SchoolIcon />} />
			<div className="flex flex-col min-h-screen">
				<div className="flex flex-col gap-6">
					<SchoolFilters
						searchQuery={searchQuery}
						sortBy={sortBy}
						sortDirection={sortDirection}
						onAddSchool={handleAddSchool}
						onSearchQueryChange={setSearchQuery}
						onSortByChange={setSortBy}
						onSortDirectionToggle={toggleSortDirection}
					/>
					{schools?.length === 0 && !loading && (
						<p className="text-center text-sm text-default-500">
							No schools found. Please add a new school.
						</p>
					)}
					<SchoolList
						isLoading={loading}
						schools={filteredAndSortedSchools}
						onDeleteSchool={handleDeleteSchool}
						onEditSchool={handleEditSchool}
					/>
				</div>


				<SchoolModal
					isOpen={isModalOpen}
					mode={modalMode}
					school={
						selectedSchool && '_id' in selectedSchool
							? (selectedSchool as School)
							: undefined
					}
					onClose={() => setIsModalOpen(false)}
					onSuccess={handleSubmitSchool}
				/>

				<ConfirmationModal
					body={
						confirmationModalType === 'edit'
							? `Are you sure you want to save the changes for "${selectedSchool?.name?.en}"?`
							: `Are you sure you want to delete the school "${selectedSchool?.name?.en}"? The related majors in this school will be deleted. This action cannot be undone.`
					}
					confirmColor={confirmationModalType === 'edit' ? 'primary' : 'danger'}
					confirmText={confirmationModalType === 'edit' ? 'Save' : 'Delete'}
					isOpen={confirmationModalType !== null}
					title={
						confirmationModalType === 'edit' ? 'Save School' : 'Delete School'
					}
					onClose={() => {
						setConfirmationModalType(null);
						setSelectedSchool(undefined);
					}}
					onConfirm={handleConfirm}
				/>
			</div>
		</>
	);
}

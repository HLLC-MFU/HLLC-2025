'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import {
	ArrowLeft,
	Building2,
	GraduationCap,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react';

import { ConfirmationModal } from '../../../../components/modal/ConfirmationModal';

import { MajorModal } from './_components/MajorModal';
import { SchoolDetailSkeleton } from './_components/SchoolDetailSkeleton';

import { useSchools } from '@/hooks/useSchool';
import { Major } from '@/types/major';

export default function SchoolDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const { schools, loading, addMajor, editMajor, deleteMajor } = useSchools();
	const school = useMemo(
		() => schools.find((s) => s._id === id),
		[schools, id],
	);

	const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
	const [selectedMajor, setSelectedMajor] = useState<
		Major | Partial<Major> | undefined
	>();
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [confirmationModalType, setConfirmationModalType] = useState<
		'delete' | 'edit' | null
	>(null);

	const handleAddMajor = () => {
		setModalMode('add');
		setSelectedMajor(undefined);
		setIsMajorModalOpen(true);
	};

	const handleEditMajor = (major: Major) => {
		setModalMode('edit');
		setSelectedMajor(major);
		setIsMajorModalOpen(true);
	};

	const handleDeleteMajor = (major: Major) => {
		setSelectedMajor(major);
		setConfirmationModalType('delete');
	};

	const handleSaveMajor = async (
		majorData: Partial<Major>,
		mode: 'add' | 'edit',
	) => {
		if (!school) return;

		if (mode === 'edit') {
			setSelectedMajor(majorData);
			setConfirmationModalType('edit');
		} else {
			// Seamless add major
			await addMajor(school._id, majorData);
		}
	};

	const handleConfirm = async () => {
		if (!school || !selectedMajor) return;
		setConfirmationModalType(null);
		setSelectedMajor(undefined);

		if (confirmationModalType === 'delete' && selectedMajor._id) {
			await deleteMajor(school._id, selectedMajor._id);
		} else if (confirmationModalType === 'edit') {
			if (selectedMajor._id) {
				await editMajor({
					...selectedMajor,
					school: school._id,
				});
			}
		}
	};

	if (loading) return <SchoolDetailSkeleton />;
	if (!school) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-center text-lg">School not found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen">
			<div className="container mx-auto px-4">
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-4">
						<Button
							startContent={<ArrowLeft />}
							variant="flat"
							onPress={() => router.back()}
						>
							Back
						</Button>
						<h1 className="text-2xl font-bold">
							{school.name?.en ?? 'Unnamed School'}
						</h1>
					</div>

					<Card>
						<CardHeader className="flex gap-3 p-4">
							<Card
								className="w-12 h-12 flex items-center justify-center"
								radius="md"
							>
								{school.acronym ?? 'N/A'}
							</Card>
							<div className="flex flex-col">
								<p className="text-lg font-semibold">
									{school.name?.en ?? 'N/A'}
								</p>
								<p className="text-small text-default-500">
									{school.name?.th ?? 'N/A'}
								</p>
							</div>
						</CardHeader>
						<Divider />
						<CardBody className="gap-4 p-4">
							<div className="flex items-center gap-2">
								<Building2 className="text-default-500" size={16} />
								<span className="text-sm text-default-500">
									{school.acronym ?? 'N/A'}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<GraduationCap className="text-default-500" size={16} />
								<span className="text-sm text-default-500">
									{school.majors?.length ?? 0} Programs
								</span>
							</div>
							<p className="text-sm text-default-500">
								{school.detail?.en ?? 'No details available.'}
							</p>
						</CardBody>
					</Card>

					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">Majors</h2>
						<Button
							color="primary"
							startContent={<Plus size={16} />}
							onPress={handleAddMajor}
						>
							Add Major
						</Button>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{(school.majors ?? []).map((major) => (
							<Card
								key={major._id ?? major.acronym}
								isHoverable
								className="h-full"
							>
								<CardHeader className="flex gap-3 p-4">
									<Card
										className="w-12 h-12 flex items-center justify-center"
										radius="md"
									>
										{major.acronym ?? 'N/A'}
									</Card>
									<div className="flex flex-col items-start min-w-0 text-start">
										<p className="text-lg font-semibold truncate w-full">
											{major.name?.en ?? 'N/A'}
										</p>
										<p className="text-small text-default-500 truncate w-full">
											{major.name?.th ?? 'N/A'}
										</p>
									</div>
								</CardHeader>
								<Divider />
								<CardBody className="gap-4 p-4">
									<p className="text-sm text-default-500 line-clamp-2">
										{major.detail?.en ?? 'No details available.'}
									</p>
								</CardBody>
								<Divider />
								<CardBody className="flex justify-end p-4">
									<div className="flex gap-2">
										<Button
											isIconOnly
											size="sm"
											variant="light"
											onPress={() => handleEditMajor(major)}
										>
											<Pencil size={16} />
										</Button>
										<Button
											isIconOnly
											color="danger"
											size="sm"
											variant="light"
											onPress={() => handleDeleteMajor(major)}
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</CardBody>
							</Card>
						))}
					</div>
				</div>
			</div>

			<MajorModal
				isOpen={isMajorModalOpen}
				major={selectedMajor as Major}
				mode={modalMode}
				school={school._id}
				onClose={() => setIsMajorModalOpen(false)}
				onSuccess={handleSaveMajor}
			/>

			<ConfirmationModal
				body={
					confirmationModalType === 'edit'
						? `Are you sure you want to save the changes for "${selectedMajor?.name?.en}"?`
						: `Are you sure you want to delete the major "${selectedMajor?.name?.en}"? This action cannot be undone.`
				}
				confirmColor={confirmationModalType === 'edit' ? 'primary' : 'danger'}
				confirmText={confirmationModalType === 'edit' ? 'Save' : 'Delete'}
				isOpen={confirmationModalType !== null}
				title={confirmationModalType === 'edit' ? 'Save Major' : 'Delete Major'}
				onClose={() => {
					setConfirmationModalType(null);
					setSelectedMajor(undefined);
				}}
				onConfirm={handleConfirm}
			/>
		</div>
	);
}

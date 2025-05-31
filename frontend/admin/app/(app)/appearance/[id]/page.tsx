'use client';

import { useParams, useRouter } from 'next/navigation';
import { SchoolDetailSkeleton } from '../../schools/[id]/_components/SchoolDetailSkeleton';
import { useSchoolByAppearance } from '@/hooks/useSchoolByAppearance';
import { Button } from '@heroui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Appearance } from '@/types/appearance';
import { apiRequest } from '@/utils/api';
import { DeleteConfirmationModal } from './_components/DeleteConfirmationModal';
import { UpdateConfirmationModal } from './_components/UpdateConfirmationModal';

export default function AppearanceDetailsPage() {

    const params = useParams();
    const router = useRouter();
    const appearanceId = params?.id as string;
    const { appearance, loading, error, setAppearance } = useSchoolByAppearance(appearanceId);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
    const [selectedAppearance, setSelectedAppearance] = useState<Appearance | undefined>();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [backgroundDraft, setBackgroundDraft] = useState<File | null>(null);
    const [colorDrafts, setColorDrafts] = useState<Record<string, string>>({
        primary: appearance?.colors.primary ?? "#000000",
        secondary: appearance?.colors.secondary ?? "#000000",
    });
    const [assetDrafts, setAssetDrafts] = useState<Record<string, File | null>>({
        background: null,
        backpack: null,
        appearance: null,
    });

    const handleAddApperance = () => {
        setModalMode("add");
        setSelectedAppearance(undefined);
        setIsAppearanceModalOpen(true);
    };

    const handleEditAppearance = (appearance: Appearance) => {
        setModalMode("edit");
        setSelectedAppearance(appearance);
        setIsAppearanceModalOpen(true);
    };

    const handleDeleteAppearance = (appearance: Appearance) => {
        setSelectedAppearance(appearance);
        setIsDeleteModalOpen(true);
    };

    const updateAppearanceField = async (
        id: string,
        field: "colors" | "assets",
        key: string,
        value: string | File
    ) => {
        if (!appearance) return;

        const formData = new FormData();

        if (field === "colors") {
            const updatedColors = {
                ...appearance.colors,
                [key]: value as string,
            };
            Object.entries(updatedColors).forEach(([k, v]) => {
                formData.append(`colors[${k}]`, v);
            });
        }

        if (field === "assets") {
            const updatedAssets = {
                ...appearance.assets,
                [key]: value,
            };
            Object.entries(updatedAssets).forEach(([k, v]) => {
                if (v instanceof File) {
                    formData.append(`assets[${k}]`, v);
                } else {
                    formData.append(`assets[${k}]`, v);
                }
            });
        }

        try {
            const res = await fetch(`http://localhost:8080/api/appearances/${id}`, {
                method: "PATCH",
                body: formData,
                credentials: "include",
            });

            const contentType = res.headers.get("content-type");
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${text}`);
            }

            if (contentType?.includes("application/json")) {
                const json = await res.json();
                setAppearance(json.data);
                return json.data as Appearance;
            } else {
                throw new Error("Unexpected response format");
            }
        } catch (err) {
            console.error(`Error updating ${field}.${key}`, err);
            throw err;
        }
    };


    const handleSaveAppearance = async (appearanceData: Partial<Appearance>, mode: "add" | "edit") => {
        if (!appearance) return;
        try {
            let res: Awaited<ReturnType<typeof apiRequest>> | undefined;
            if (mode === "add") {

                res = await apiRequest("/appearances", "POST", {
                    ...appearance,
                    appearance: appearance._id
                });
                console.log("Adding appearance:", res);
            } else if (mode === "edit" && appearanceData._id) {

                res = await apiRequest(`/appearances/${appearanceData._id}`, "PATCH", appearanceData);
            }
            if (res?.data && res.data !== null) {
                const updatedAppearance = (res.data as { data: Appearance }).data;

                setAppearance(updatedAppearance);
            }
        } catch (error) {
            console.error("Error saving appearance:", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedAppearance || !appearance) return;
        try {
            await apiRequest(`/appearances/${selectedAppearance._id}`, "DELETE");
            setAppearance(null);
            setIsDeleteModalOpen(false);
            setSelectedAppearance(undefined);
        } catch (error) {
            console.error("Error deleting appearance:", error);
        }
    };

    const handleConfirmUpdate = async () => {
        if (!appearance) return;
        try {
            await Promise.all([
                ...(["primary", "secondary"] as const).map((key) =>
                    updateAppearanceField(appearance._id, "colors", key, colorDrafts[key])
                ),
                backgroundDraft && updateAppearanceField(appearance._id, "assets", "background", backgroundDraft),
            ]);
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Update failed", error);
        }
    };


    useEffect(() => {
        if (appearance?.colors) {
            setColorDrafts({
                primary: appearance.colors.primary,
                secondary: appearance.colors.secondary,
            });
        }
        if (appearance?.assets?.background) {
            setBackgroundDraft(null);
        }
    }, [appearance]);


    if (appearance?._id) {
        console.log('Fetched school data:', appearance.school?.name.en);
    }

    if (loading) return <SchoolDetailSkeleton />;
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-center text-red-500">{error}</p>
            </div>
        );
    }
    const schoolId = appearance?.school?._id ?? appearance?.school?._id;
    if (!appearance || !appearance.school || !schoolId) {
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
                        <Button variant="flat" startContent={<ArrowLeft />} onPress={() => router.back()}>
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">Appearance : {appearance.school?.name.en ?? "Unnamed School"}</h1>
                    </div>

                    {/* Background Section */}
                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                                <h1 className="text-sm font-bold">{appearance.school.acronym ?? "N/A"}</h1>
                            </Card>
                            <div className="flex flex-col items-start">
                                <h1 className="text-xl font-semibold mb-1">Background</h1>
                            </div>
                        </CardHeader>
                        <CardBody className="flex flex-col items-center">
                            <img
                                src={`http://localhost:8080/uploads/${appearance?.assets.background}`}
                                alt="background"
                                className="w-full max-w-md rounded mx-auto mb-4"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAssetDrafts((prev) => ({ ...prev, background: file }));
                                    }
                                }}
                                className="text-xs mt-2"
                            />
                            {assetDrafts.background && (
                                <>
                                    <p className="text-xs text-green-700 mt-1">📁 {assetDrafts.background.name}</p>
                                    <Button
                                        size="sm"
                                        className="text-xs mt-1"
                                        onPress={() =>
                                            updateAppearanceField(appearance._id, 'assets', 'background', assetDrafts.background!)
                                        }
                                    >
                                        Save background
                                    </Button>
                                </>
                            )}
                        </CardBody>
                    </Card>

                    {/* Icon section */}
                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                                <h1 className="text-sm font-bold">{appearance?.school?.acronym ?? "N/A"}</h1>
                            </Card>
                            <div className='flex flex-col items-start'>
                                <h1 className="text-xl font-semibold mb-1">Icons</h1>
                                <p className="text-sm text-gray-500">Logo, Banner, Thumbnail</p>
                            </div>
                        </CardHeader>
                        <CardBody className="grid grid-cols-3 gap-4">
                            {["backpack", "appearance"].map((key) => (
                                <div key={key} className="flex flex-col items-center">
                                    <img
                                        src={`http://localhost:8080/uploads/${appearance?.assets[key]}`}
                                        alt={key}
                                        className="w-full max-w-[150px] rounded"
                                    />
                                    <p className="text-xs mt-1">{key}</p>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAssetDrafts((prev) => ({
                                                    ...prev,
                                                    [key]: file,
                                                }));
                                            }
                                        }}
                                        className="text-xs mt-2"
                                    />
                                    {assetDrafts[key] && (
                                        <>
                                            <p className="text-xs text-green-700 mt-1">📁 {assetDrafts[key]!.name}</p>
                                            <Button
                                                size="sm"
                                                className="text-xs mt-1"
                                                onPress={() =>
                                                    updateAppearanceField(appearance._id, "assets", key, assetDrafts[key]!)
                                                }
                                            >
                                                Save {key}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    {/* color section */}
                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                                <h1 className="text-sm font-bold">{appearance?.school.acronym ?? "N/A"}</h1>
                            </Card>
                            <div className="flex flex-col items-start">
                                <h1 className="text-xl font-semibold mb-2">Colors</h1>
                                <h2 className="text-sm text-gray-500">Primary / Secondary</h2>
                            </div>
                        </CardHeader>

                        <CardBody className="gap-4 grid grid-cols-2">
                            {(["primary", "secondary"] as const).map((key) => (
                                <div key={key} className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-16 h-16 rounded shadow border"
                                        style={{ backgroundColor: colorDrafts[key] }}
                                    />
                                    <p className="text-xs">{colorDrafts[key]}</p>
                                    <input
                                        type="color"
                                        value={colorDrafts[key]}
                                        onChange={(e) =>
                                            setColorDrafts((prev) => ({
                                                ...prev,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        className="w-10 h-6 cursor-pointer"
                                    />
                                </div>
                            ))}
                        </CardBody>
                        <div className="flex justify-end p-4">
                            <Button
                                size="sm"
                                className="text-sm"
                                onPress={() => setIsUpdateModalOpen(true)}
                            >
                                Save Colors
                            </Button>
                        </div>
                    </Card>

                    {/* UI section */}
                    <Card>
                        <CardHeader className='flex gap-3 p-4'>
                            <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                                <h1 className="text-sm font-bold">{appearance.school.acronym ?? "N/A"}</h1>
                            </Card>
                            <div className='flex flex-col items-start'>
                                <h1 className="text-xl font-semibold mb-2">UI</h1>
                                <h2 className="text-sm p-2 rounded overflow-x-auto"></h2>
                            </div>
                        </CardHeader>
                        <CardBody className='gap-2 grid grid-cols-3'>
                            <p className="text-sm p-2 rounded overflow-x-auto">
                                {JSON.stringify(appearance.colors.primary, null, 2)}
                            </p>
                            <p className="text-sm p-2 rounded overflow-x-auto">
                                {JSON.stringify(appearance.colors.secondary, null, 2)}
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                appearance={selectedAppearance}
            />

            <UpdateConfirmationModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onConfirm={handleConfirmUpdate}
                appearance={selectedAppearance}
            />
        </div>
    );
}

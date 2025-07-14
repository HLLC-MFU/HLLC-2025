'use client';

import { Landmark, LandmarkType } from "@/types/landmark";
import { Divider, Form, Input, Modal, ModalBody, ModalContent, ModalHeader, NumberInput, Card, CardBody, CardHeader } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";
import ImageInput from '@/components/ui/imageInput';
import { Button, Autocomplete, AutocompleteItem, ModalFooter, Chip } from '@heroui/react';
import { MapPin, Clock, Ruler, Hash, Globe, Type, Image as ImageIcon, Coins } from 'lucide-react';

type AddLandmarkProps = {
    isOpen: boolean;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess: (Landmark: FormData) => Promise<void>;
    landmark: Landmark | null;
};

export function LandmarkModal({
    isOpen,
    mode,
    onClose,
    onSuccess,
    landmark,
}: AddLandmarkProps) {

    const defaultLandmark = {
        name: { en: '', th: '' },
        hint: { en: '', th: '' },
        location: { latitude: '', longitude: '', mapUrl: '' },
        order: 0,
        cooldown: 0,
        limitDistance: 0,
        type: LandmarkType.NORMAL,
        mapCoordinate: { x: 0, y: 0 },
        hintImage: '',
        coinImage: '',
    };

    const [imageError, setImageError] = useState<Record<string, boolean>>({
        hintImage: false,
        coinImage: false,
    });

    const [landmarkField, setLandmarkField] = useState<Landmark>(defaultLandmark);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'add') {
            setLandmarkField(defaultLandmark);
            setImageError({ hintImage: false, coinImage: false });
        } else if (mode === 'edit' && landmark) {
            setLandmarkField({
                name: { en: landmark.name.en, th: landmark.name.th },
                hint: { en: landmark.hint.en, th: landmark.hint.th },
                location: {
                    latitude: landmark.location?.latitude || '',
                    longitude: landmark.location?.longitude || '',
                    mapUrl: landmark.location?.mapUrl || ''
                },
                mapCoordinate: {
                    x: Number(landmark.mapCoordinate?.x) || 0,
                    y: Number(landmark.mapCoordinate?.y) || 0
                },
                order: landmark.order,
                cooldown: landmark.cooldown,
                limitDistance: landmark.limitDistance,
                type: landmark.type,
                hintImage: landmark.hintImage,
                coinImage: landmark.coinImage,
            })
            setImageError({ hintImage: false, coinImage: false })
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!landmarkField.hintImage) {
            setImageError(prev => ({ ...prev, hintImage: true }));
            setIsSubmitting(false);
            return;
        }
        if (!landmarkField.coinImage) {
            setImageError(prev => ({ ...prev, coinImage: true }));
            setIsSubmitting(false);
            return;
        }

        const landmarkData = new FormData();
        landmarkData.append('name[en]', landmarkField.name.en);
        landmarkData.append('name[th]', landmarkField.name.th);
        landmarkData.append('hint[en]', landmarkField.hint.en);
        landmarkData.append('hint[th]', landmarkField.hint.th);
        landmarkData.append('location[latitude]', landmarkField.location.latitude);
        landmarkData.append('location[longitude]', landmarkField.location.longitude);
        landmarkData.append('location[mapUrl]', landmarkField.location.mapUrl);
        landmarkData.append('mapCoordinate[x]', landmarkField.mapCoordinate.x.toString());
        landmarkData.append('mapCoordinate[y]', landmarkField.mapCoordinate.y.toString());
        landmarkData.append('order', landmarkField.order.toString());
        landmarkData.append('cooldown', landmarkField.cooldown.toString());
        landmarkData.append('limitDistance', landmarkField.limitDistance.toString());
        if (!(typeof landmarkField.hintImage === 'string')) landmarkData.append('hintImage', landmarkField.hintImage);
        if (!(typeof landmarkField.coinImage === 'string')) landmarkData.append('coinImage', landmarkField.coinImage);
        if (!landmarkField.type) {
            landmarkData.append('type', '');
        } else {
            landmarkData.append('type', landmarkField.type);
        }

        try {
            await onSuccess(landmarkData);
            onClose();
            setLandmarkField(defaultLandmark);
        } catch (error) {
            console.error('Error submitting landmark:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const formatCooldown = (cooldown: number) => {
        if (cooldown >= 3600) {
            return `${Math.floor(cooldown / 3600)}h ${Math.floor((cooldown % 3600) / 60)}m`;
        } else if (cooldown >= 60) {
            return `${Math.floor(cooldown / 60)}m`;
        }
        return `${cooldown}s`;
    };

    const formatDistance = (distance: number) => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)}km`;
        }
        return `${distance}m`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setLandmarkField(defaultLandmark);
            }}
            size="5xl"
            isDismissable={false}
            classNames={{
                body: "py-6",
                header: "border-b-1 border-divider",
                footer: "border-t-1 border-divider"
            }}
        >
            <Form onSubmit={(e) => handleSubmit(e)}>
                <ModalContent className="max-h-[90vh] overflow-y-auto">
                    <ModalHeader className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {mode === 'add' ? 'Add New Landmark' : 'Edit Landmark'}
                                </h2>
                                <p className="text-sm text-default-500">
                                    {mode === 'add' 
                                        ? 'Create a new landmark with all required information'
                                        : 'Update landmark information and settings'
                                    }
                                </p>
                            </div>
                        </div>
                    </ModalHeader>
                    
                    <ModalBody className="gap-6">
                        {/* Basic Information Section */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Type className="w-4 h-4 text-primary" />
                                    <h3 className="font-semibold">Basic Information</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(['en', 'th'] as const).map((key) => {
                                        const lang = key === 'en' ? 'English' : 'Thai';
                                        const flag = key === 'en' ? '🇺🇸' : '🇹🇭';
                                        return (
                                            <Input
                                                key={`name-${key}`}
                                                isRequired
                                                label={`${flag} Name (${lang})`}
                                                placeholder={`Enter ${lang} name`}
                                                value={landmarkField.name[key]}
                                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, name: { ...prev.name, [key]: value } }))}
                                                classNames={{
                                                    input: "text-sm",
                                                    label: "text-sm font-medium"
                                                }}
                                            />
                                        );
                                    })}
                                    {(['en', 'th'] as const).map((key) => {
                                        const lang = key === 'en' ? 'English' : 'Thai';
                                        const flag = key === 'en' ? '🇺🇸' : '🇹🇭';
                                        return (
                                            <Input
                                                key={`hint-${key}`}
                                                isRequired
                                                label={`${flag} Hint (${lang})`}
                                                placeholder={`Enter ${lang} hint`}
                                                value={landmarkField.hint[key]}
                                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, hint: { ...prev.hint, [key]: value } }))}
                                                classNames={{
                                                    input: "text-sm",
                                                    label: "text-sm font-medium"
                                                }}
                                            />
                                        );
                                    })}
                                    <Autocomplete
                                        isRequired
                                        label="Landmark Type"
                                        placeholder="Select landmark type"
                                        defaultItems={Object.values(LandmarkType).map(type => ({ key: type, label: type }))}
                                        selectedKey={landmarkField.type}
                                        onSelectionChange={(value) => setLandmarkField(prev => ({ ...prev, type: value as LandmarkType }))}
                                        classNames={{
                                            base: "md:col-span-2"
                                        }}
                                        endContent={
                                            landmarkField.type && (
                                                <Chip size="sm" variant="flat">
                                                    {landmarkField.type.replace('_', ' ')}
                                                </Chip>
                                            )
                                        }
                                    >
                                        {Object.values(LandmarkType).map(type => (
                                            <AutocompleteItem key={type} className="capitalize">
                                                {type.replace('_', ' ')}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Game Settings Section */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-secondary" />
                                    <h3 className="font-semibold">Landmark Settings</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <NumberInput
                                            isRequired
                                            label="Order"
                                            placeholder="Enter order"
                                            value={landmarkField.order}
                                            onValueChange={(value) => setLandmarkField(prev => ({ ...prev, order: value }))}
                                            startContent={<Hash className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                label: "text-sm font-medium"
                                            }}
                                        />
                                        <p className="text-xs text-default-500">Display order in the landmark</p>
                                    </div>
                                    <div className="space-y-2">
                                        <NumberInput
                                            isRequired
                                            label="Cooldown (seconds)"
                                            placeholder="Enter cooldown"
                                            value={landmarkField.cooldown}
                                            onValueChange={(value) => setLandmarkField(prev => ({ ...prev, cooldown: value }))}
                                            startContent={<Clock className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                label: "text-sm font-medium"
                                            }}
                                        />
                                        <p className="text-xs text-default-500">
                                            {landmarkField.cooldown > 0 ? `≈ ${formatCooldown(landmarkField.cooldown)}` : 'No cooldown'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <NumberInput
                                            isRequired
                                            label="Limit Distance (meters)"
                                            placeholder="Enter distance"
                                            value={landmarkField.limitDistance}
                                            onValueChange={(value) => setLandmarkField(prev => ({ ...prev, limitDistance: value }))}
                                            startContent={<Ruler className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                label: "text-sm font-medium"
                                            }}
                                        />
                                        <p className="text-xs text-default-500">
                                            {landmarkField.limitDistance > 0 ? `≈ ${formatDistance(landmarkField.limitDistance)}` : 'No limit'}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Location Section */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-success" />
                                    <h3 className="font-semibold">Location & Coordinates</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        isRequired
                                        label="Latitude"
                                        placeholder="Enter latitude (e.g., 20.0316)"
                                        value={landmarkField.location.latitude}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, latitude: value } }))}
                                        startContent={<MapPin className="w-4 h-4 text-default-400" />}
                                        classNames={{
                                            label: "text-sm font-medium"
                                        }}
                                    />
                                    <Input
                                        isRequired
                                        label="Longitude"
                                        placeholder="Enter longitude (e.g., 99.8989)"
                                        value={landmarkField.location.longitude}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, longitude: value } }))}
                                        startContent={<MapPin className="w-4 h-4 text-default-400" />}
                                        classNames={{
                                            label: "text-sm font-medium"
                                        }}
                                    />
                                    <div className="md:col-span-2 space-y-2">
                                        <Input
                                            isRequired
                                            label="Map URL"
                                            placeholder="Enter Google Maps URL"
                                            value={landmarkField.location.mapUrl}
                                            onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, mapUrl: value } }))}
                                            startContent={<Globe className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                label: "text-sm font-medium"
                                            }}
                                        />
                                        {landmarkField.location.mapUrl && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-primary" />
                                                <a 
                                                    href={landmarkField.location.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:text-primary-600 transition-colors"
                                                >
                                                    Preview map location
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        isRequired
                                        label="Map X Coordinate"
                                        placeholder="Enter X coordinate"
                                        value={landmarkField.mapCoordinate.x?.toString() ?? '0'}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, mapCoordinate: { ...prev.mapCoordinate, x: Number(value) } }))}
                                        classNames={{
                                            label: "text-sm font-medium"
                                        }}
                                    />
                                    <Input
                                        isRequired
                                        label="Map Y Coordinate"
                                        placeholder="Enter Y coordinate"
                                        value={landmarkField.mapCoordinate.y?.toString() ?? '0'}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, mapCoordinate: { ...prev.mapCoordinate, y: Number(value) } }))}
                                        classNames={{
                                            label: "text-sm font-medium"
                                        }}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Images Section */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-warning" />
                                    <h3 className="font-semibold">Images</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <ImageInput
                                            onChange={(file: File) => {
                                                setLandmarkField(prev => ({ ...prev, hintImage: file }));
                                                setImageError(prev => ({ ...prev, hintImage: false }));
                                            }}
                                            onCancel={() => setLandmarkField(prev => ({ ...prev, hintImage: '' }))}
                                            title="Hint Image"
                                            image={mode === 'edit' ? (typeof landmarkField.hintImage === 'string' ? landmarkField.hintImage : '') : ''}
                                            isRequired={!!imageError.hintImage}
                                        />
                                        <p className="text-xs text-default-500">
                                            Image shown as a hint to help users find this landmark
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <ImageInput
                                            onChange={(file: File) => {
                                                setLandmarkField(prev => ({ ...prev, coinImage: file }));
                                                setImageError(prev => ({ ...prev, coinImage: false }));
                                            }}
                                            onCancel={() => setLandmarkField(prev => ({ ...prev, coinImage: '' }))}
                                            title="Coin Image"
                                            image={mode === 'edit' ? (typeof landmarkField.coinImage === 'string' ? landmarkField.coinImage : '') : ''}
                                            isRequired={!!imageError.coinImage}
                                        />
                                        <p className="text-xs text-default-500">
                                            Image shown when user collects the coin at this landmark
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </ModalBody>
                    
                    <ModalFooter className="gap-3">
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                onClose();
                                setLandmarkField(defaultLandmark);
                            }}
                            isDisabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            type="submit"
                            isLoading={isSubmitting}
                            spinner={
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            }
                        >
                            {isSubmitting 
                                ? (mode === 'add' ? 'Adding...' : 'Saving...')
                                : (mode === 'add' ? 'Add Landmark' : 'Save Changes')
                            }
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    )
}
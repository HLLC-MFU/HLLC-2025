'use client';

import { Landmark, LandmarkType } from "@/types/landmark";
import { Divider, Form, Input, Modal, ModalBody, ModalContent, ModalHeader, NumberInput } from "@heroui/react";
import { FormEvent, useEffect, useState } from "react";
import ImageInput from '@/components/ui/imageInput';
import { Button, Autocomplete, AutocompleteItem, ModalFooter } from '@heroui/react';

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

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!landmarkField.hintImage) return setImageError(prev => ({ ...prev, hintImage: true }));
        if (!landmarkField.coinImage) return setImageError(prev => ({ ...prev, coinImage: true }));

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

        onSuccess(landmarkData);
        onClose();
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setLandmarkField(defaultLandmark);
            }}
            size="3xl"
            scrollBehavior="inside"
            isDismissable={false}
        >
            <Form onSubmit={(e) => handleSubmit(e)}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === 'add' ? 'Add Landmark' : 'Edit Landmark'}
                    </ModalHeader>
                    <Divider />
                    <ModalBody className="flex gap-6 w-full">
                        <div className="grid grid-cols-2 gap-4">
                            {(['en', 'th'] as const).map((key) => {
                                const lang = key === 'en' ? 'English' : 'Thai';
                                return (
                                    <Input
                                        key={`name-${key}`}
                                        isRequired
                                        label={`Name (${lang})`}
                                        placeholder={`Enter ${lang} Name`}
                                        value={landmarkField.name[key]}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, name: { ...prev.name, [key]: value } }))}
                                    />
                                );
                            })}
                            {(['en', 'th'] as const).map((key) => {
                                const lang = key === 'en' ? 'English' : 'Thai';
                                return (
                                    <Input
                                        key={`hint-${key}`}
                                        isRequired
                                        label={`Hint (${lang})`}
                                        placeholder={`Enter ${lang} Hint`}
                                        value={landmarkField.hint[key]}
                                        onValueChange={(value) => setLandmarkField(prev => ({ ...prev, hint: { ...prev.hint, [key]: value } }))}
                                    />
                                );
                            })}
                            <NumberInput
                                isRequired
                                label='Order'
                                placeholder='Enter Order'
                                value={landmarkField.order}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, order: value }))}
                            />
                            <NumberInput
                                isRequired
                                label='Cooldown'
                                placeholder='Enter Cooldown'
                                value={landmarkField.cooldown}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, cooldown: value }))}
                            />
                            <NumberInput
                                isRequired
                                label='Limit Distance'
                                placeholder='Enter Limit Distance'
                                value={landmarkField.limitDistance}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, limitDistance: value }))}
                            />
                            <Input
                                isRequired
                                label='Latitude'
                                placeholder='Enter Latitude'
                                value={landmarkField.location.latitude}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, latitude: value } }))}
                            />
                            <Input
                                isRequired
                                label='Longitude'
                                placeholder='Enter Longitude'
                                value={landmarkField.location.longitude}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, longitude: value } }))}
                            />
                            <Input
                                isRequired
                                label='Map URL'
                                placeholder='Enter Map URL'
                                value={landmarkField.location.mapUrl}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, location: { ...prev.location, mapUrl: value } }))}
                            />
                            <Input
                                isRequired
                                label='Map X'
                                placeholder='Enter Map X'
                                value={landmarkField.mapCoordinate.x?.toString() ?? 0}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, mapCoordinate: { ...prev.mapCoordinate, x: Number(value) } }))}
                            />
                            <Input
                                isRequired
                                label='Map Y'
                                placeholder='Enter Map Y'
                                value={landmarkField.mapCoordinate.y?.toString() ?? 0}
                                onValueChange={(value) => setLandmarkField(prev => ({ ...prev, mapCoordinate: { ...prev.mapCoordinate, y: Number(value) } }))}
                            />
                            <Autocomplete
                                isRequired
                                label='Type'
                                placeholder='Select Type'
                                defaultItems={Object.values(LandmarkType).map(type => ({ key: type, label: type }))}
                                selectedKey={landmarkField.type}
                                onSelectionChange={(value) => setLandmarkField(prev => ({ ...prev, type: value as LandmarkType }))}
                            >
                                {Object.values(LandmarkType).map(type => (
                                    <AutocompleteItem key={type}>{type}</AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>
                        <Divider orientation="vertical" className="mx-2" />
                        <div className="grid grid-cols-1 gap-4 min-w-[250px]">
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
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter className="w-full">
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                onClose();
                                setLandmarkField(defaultLandmark);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" type='submit'>
                            {mode === 'add' ? 'Add' : 'Save'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Form>
        </Modal>
    )
}
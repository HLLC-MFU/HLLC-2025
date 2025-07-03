'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    NumberInput,
    Accordion,
    AccordionItem,
    Divider,
    Checkbox,
    DatePicker,
    Card,
    AutocompleteItem,
    Autocomplete,
    Form,
} from '@heroui/react';
import { Sponsors } from '@/types/sponsors';
import { Evoucher } from '@/types/evoucher';
import ImageInput from '@/components/ui/imageInput';
import { fromDate } from '@internationalized/date';

type AddEvoucherProps = {
    isOpen: boolean;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess: (sponsorsData: FormData) => Promise<void>;
    sponsors: Sponsors[];
    evoucher: Evoucher | null;
};

export function EvoucherModal({
    isOpen,
    mode,
    onClose,
    onSuccess,
    sponsors,
    evoucher,
}: AddEvoucherProps) {
    const currentDate = new Date();
    const tomorrow = new Date();
    new Date(tomorrow.setDate(tomorrow.getDate() + 1))
    const dataField = {
        name: { en: '', th: '' },
        acronym: '',
        order: 0,
        startAt: currentDate,
        endAt: tomorrow,
        detail: { en: '', th: '' },
        photo: { front: '', back: '', home: '' },
        amount: 0,
        sponsor: '',
        metadata: { type: '' },
    }
    const [imageError, setImageError] = useState<Record<string, boolean>>({
        front: false,
        back: false,
        home: false,
    });
    const [evoucherField, setEvoucherField] = useState<Evoucher>(dataField);

    useEffect(() => {
        if (mode === 'add') {
            setEvoucherField(dataField);
            setImageError({ front: false, back: false, home: false })
        } else if (mode === 'edit' && evoucher) {
            setEvoucherField({
                name: { en: evoucher.name.en, th: evoucher.name.th },
                acronym: evoucher.acronym,
                order: evoucher.order,
                startAt: new Date(evoucher.startAt),
                endAt: new Date(evoucher.endAt),
                detail: { en: evoucher.detail.en, th: evoucher.detail.en },
                photo: { front: evoucher.photo.front, back: evoucher.photo.back, home: evoucher.photo.home },
                amount: evoucher.amount,
                sponsor: (evoucher.sponsor as Sponsors)._id ?? '',
                metadata: { type: evoucher.metadata?.type ?? '' },
            })
            setImageError({ front: false, back: false, home: false })
        }
    }, [isOpen]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!evoucherField.photo.front) return setImageError(prev => ({ ...prev, front: true }));
        if (!evoucherField.photo.back) return setImageError(prev => ({ ...prev, back: true }));
        if (!evoucherField.photo.home) return setImageError(prev => ({ ...prev, home: true }));

        const evoucherData = new FormData();
        evoucherData.append('name[en]', evoucherField.name.en);
        evoucherData.append('name[th]', evoucherField.name.th);
        evoucherData.append('acronym', evoucherField.acronym);
        evoucherData.append('order', evoucherField.order.toString());
        evoucherData.append('startAt', evoucherField.startAt.toISOString());
        evoucherData.append('endAt', evoucherField.endAt.toISOString());
        evoucherData.append('detail[en]', evoucherField.detail.en);
        evoucherData.append('detail[th]', evoucherField.detail.th);
        evoucherData.append('amount', evoucherField.amount.toString());
        evoucherData.append('sponsor', evoucherField.sponsor.toString());
        if (!(typeof evoucherField.photo.front === 'string')) evoucherData.append('photo[front]', evoucherField.photo.front);
        if (!(typeof evoucherField.photo.back === 'string')) evoucherData.append('photo[back]', evoucherField.photo.back);
        if (!(typeof evoucherField.photo.home === 'string')) evoucherData.append('photo[home]', evoucherField.photo.home);
        if (!evoucherField.metadata?.type) {
            evoucherData.append('metadata[type]', '');
        } else {
            evoucherData.append('metadata[type]', evoucherField.metadata.type);
        }

        onSuccess(evoucherData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setEvoucherField(dataField);
            }}
            size="3xl"
            scrollBehavior="inside"
            isDismissable={false}
        >
            <Form onSubmit={(e) => handleSubmit(e)}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === 'add' ? `Add Evoucher` : 'Edit Evoucher'}
                    </ModalHeader>
                    <Divider />
                    <ModalBody className="flex gap-6 w-full">
                        <div className="grid grid-cols-2 gap-4">
                            {(['en', 'th'] as const).map((key) => {
                                const lang = key === 'en' ? 'English' : 'Thai'
                                return (
                                    <Input
                                        isRequired
                                        label={`Name (${lang})`}
                                        placeholder={`Enter ${lang} Name`}
                                        value={evoucherField.name[key]}
                                        onValueChange={(value) => setEvoucherField(prev => ({ ...prev, name: { ...prev.name, [key]: value } }))}
                                    />
                                )
                            })}
                            <Input
                                isRequired
                                label='Acronym'
                                placeholder='Enter Acronym'
                                value={evoucherField.acronym}
                                onValueChange={(value) => setEvoucherField(prev => ({ ...prev, acronym: value }))}
                            />
                            <NumberInput
                                isRequired
                                label='Order'
                                placeholder='Enter Order'
                                value={evoucherField.order}
                                onValueChange={(value) => setEvoucherField(prev => ({ ...prev, order: value }))}
                            />
                            {(['startAt', 'endAt'] as const).map((key) => (
                                <DatePicker
                                    isRequired
                                    label={<span className='capitalize'>{key.slice(0, -2)}</span>}
                                    value={fromDate(evoucherField[key], 'Asia/Bangkok')}
                                    onChange={(value) => setEvoucherField(prev => ({ ...prev, [key]: value?.toDate() ?? prev[key] }))}
                                />
                            ))}
                            {(['en', 'th'] as const).map((key) => {
                                const lang = key === 'en' ? 'English' : 'Thai'
                                return (
                                    <Input
                                        isRequired
                                        label={`Detail (${lang})`}
                                        placeholder={`Enter ${lang} Detail`}
                                        value={evoucherField.detail[key]}
                                        onValueChange={(value) => setEvoucherField(prev => ({ ...prev, detail: { ...prev.detail, [key]: value } }))}
                                    />
                                )
                            })}
                            <NumberInput
                                isRequired
                                label='Code Amount'
                                placeholder='Enter Amount'
                                value={evoucherField.amount}
                                onValueChange={(value) => setEvoucherField(prev => ({ ...prev, amount: value }))}
                            />
                            <Autocomplete
                                isRequired
                                label="Sponsor"
                                placeholder="Select A Sponsor"
                                defaultItems={sponsors}
                                defaultSelectedKey={mode === 'edit' ? (evoucher?.sponsor as Sponsors)?._id : ''}
                                onSelectionChange={(value) => setEvoucherField(prev => ({ ...prev, sponsor: value as string }))}
                            >
                                {(sponsor) => (
                                    <AutocompleteItem key={sponsor._id}>
                                        {sponsor.name.en}
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        </div>
                        <Divider />
                        <div className="grid grid-cols-2 gap-4">
                            {(['front', 'back', 'home'] as const).map((key) => (
                                <ImageInput
                                    onChange={(file: File) => {
                                        setEvoucherField(prev =>
                                            ({ ...prev, photo: { ...prev.photo, [key]: file } }));
                                        setImageError(prev => ({ ...prev, [key]: false }))
                                    }}
                                    onCancel={() => setEvoucherField(prev =>
                                        ({ ...prev, photo: { ...prev.photo, [key]: '' } }))
                                    }
                                    title={`${key[0].toUpperCase() + key.slice(1)} Image`}
                                    image={mode === 'edit' ? evoucher?.photo[key] as string : ''}
                                    isRequired={!!imageError[key]}
                                />
                            ))}
                        </div>
                        <Divider />
                        <span className='text-primary'>Optional</span>
                        <Checkbox
                            size="lg"
                            isSelected={!!evoucherField.metadata?.type}
                            onValueChange={(value) => setEvoucherField(prev => ({
                                ...prev,
                                metadata: ({
                                    type: value ? 'global' : ''
                                })
                            }))}
                            className='flex items-start mb-2'
                        >
                            Use as global type
                        </Checkbox>
                    </ModalBody>
                    <Divider />
                    <ModalFooter className="w-full">
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                onClose();
                                setEvoucherField(dataField);
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
    );
}

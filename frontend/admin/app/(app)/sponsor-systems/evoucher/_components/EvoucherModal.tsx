'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { Sponsors } from '@/types/sponsors';
import { Evoucher, EvoucherStatus, EvoucherType } from '@/types/evoucher';
import ImageInput from '@/components/ui/imageInput';

type AddEvoucherProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: 'add' | 'edit') => void;
  mode: 'add' | 'edit';
  evoucherType: EvoucherType;
  sponsors: Sponsors[];
  evoucher?: Evoucher;
};

export function EvoucherModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  evoucherType,
  sponsors,
  evoucher,
}: AddEvoucherProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [imageFile, setImageFile] = useState<{ cover: File | null }>({
    cover: null,
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [acronym, setAcronym] = useState('');
  const [detailTh, setDetailTh] = useState('');
  const [detailEn, setDetailEn] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiration, setExpiration] = useState(new Date().toISOString());
  const [maxClaim, setMaxClaim] = useState<number>(0);
  const [status, setStatus] = useState<EvoucherStatus>(EvoucherStatus.ACTIVE);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) {
      setSelectedSponsor('');
      setAcronym('');
      setDetailTh('');
      setDetailEn('');
      setDiscount('');
      setExpiration(new Date().toISOString());
      setMaxClaim(0);
      setStatus(EvoucherStatus.ACTIVE);
      setImageFile({ cover: null });
      setImagePreview('');
      setErrors({});
      return;
    }

    if (isOpen && mode === 'edit' && evoucher) {
      setSelectedSponsor(evoucher.sponsors?.name?.en || '');
      setAcronym(evoucher.acronym || '');
      setDetailTh(evoucher.detail?.th || '');
      setDetailEn(evoucher.detail?.en || '');
      setDiscount(evoucher.discount || '');
      setExpiration(evoucher.expiration || new Date().toISOString());
      setMaxClaim(evoucher.claims?.maxClaim || 0);
      setStatus(evoucher.status || EvoucherStatus.ACTIVE);
      if (evoucher.photo?.coverPhoto) {
        setImagePreview(evoucher.photo.coverPhoto);
      } else {
        setImagePreview('');
      }
      setErrors({});
    }
  }, [isOpen, mode, evoucher]);

  const validationRules: {
    key: string;
    value: string;
    message: string;
    validate?: (val: string) => boolean;
  }[] = [
    { key: 'sponsor', value: selectedSponsor, message: 'Sponsor is required' },
    { key: 'acronym', value: acronym, message: 'Acronym is required' },
    {
      key: 'discount',
      value: discount,
      message: 'Discount is required',
      validate: (val) => !isNaN(Number(val)) && Number(val) >= 0,
    },
    {
      key: 'maxClaim',
      value: String(maxClaim),
      message: 'Max claim is required',
      validate: (val) => !isNaN(Number(val)),
    },
    { key: 'detailTh', value: detailTh, message: 'Detail (Thai) is required' },
    {
      key: 'detailEn',
      value: detailEn,
      message: 'Detail (English) is required',
    },
    { key: 'expiration', value: expiration, message: 'Expiration is required' },
    { key: 'status', value: status, message: 'Status is required' },
  ];

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    validationRules.forEach(({ key, value, message, validate }) => {
      if (!value || (validate && !validate(value))) {
        newErrors[key] = message;
      }
    });

    if (mode === 'add' && !(imageFile.cover instanceof File)) {
      newErrors.cover = 'Cover image is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const sponsorId = sponsors.find((s) => s.name.en === selectedSponsor)?._id;
    const formData = new FormData();
    formData.append('acronym', acronym);
    formData.append('discount', discount);
    formData.append('expiration', expiration);
    formData.append('detail[th]', detailTh);
    formData.append('detail[en]', detailEn);
    formData.append('maxClaims', String(maxClaim));
    formData.append('type', evoucherType);
    formData.append('status', status);
    if (sponsorId) formData.append('sponsors', sponsorId);
    if (imageFile.cover instanceof File || mode === 'add') {
      if (imageFile.cover instanceof File) {
        formData.append('photo[coverPhoto]', imageFile.cover);
      }
    }
    onSuccess(formData, mode);
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    setImageFile({ cover: file});

    if (!file) {
      setImagePreview(evoucher?.photo?.coverPhoto ?? "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === 'add' ? `Add ${evoucherType} E-voucher` : 'Edit E-voucher'}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="Sponsor"
              isRequired
              selectedKeys={selectedSponsor ? [selectedSponsor] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSelectedSponsor(selectedKey);
              }}
              isInvalid={!!errors.sponsor}
              errorMessage={errors.sponsor}
            >
              {sponsors.map((s) => (
                <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
              ))}
            </Select>
            <Input
              label="Acronym"
              isRequired
              value={acronym}
              onChange={(e) => setAcronym(e.target.value)}
              isInvalid={!!errors.acronym}
              errorMessage={errors.acronym}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Discount"
              type="text"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              isRequired
              isInvalid={!!errors.discount}
              errorMessage={errors.discount}
            />
            <Input
              label="Max Claims"
              type="number"
              value={String(maxClaim)}
              onChange={(e) => setMaxClaim(Number(e.target.value))}
              isRequired
              isInvalid={!!errors.maxClaim}
              errorMessage={errors.maxClaim}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Textarea
              label="Detail (Thai)"
              value={detailTh}
              onChange={(e) => setDetailTh(e.target.value)}
              isRequired
              minRows={2}
              maxRows={3}
              isInvalid={!!errors.detailTh}
              errorMessage={errors.detailTh}
            />
            <Textarea
              label="Detail (English)"
              value={detailEn}
              onChange={(e) => setDetailEn(e.target.value)}
              isRequired
              minRows={2}
              maxRows={3}
              isInvalid={!!errors.detailEn}
              errorMessage={errors.detailEn}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 flex justify-center gap-5">
              <Select
                label="Status"
                selectedKeys={[status]}
                onChange={(e) => setStatus(e.target.value as EvoucherStatus)}
                isRequired
                isInvalid={!!errors.status}
                errorMessage={errors.status}
              >
                <SelectItem key={EvoucherStatus.ACTIVE}>Active</SelectItem>
                <SelectItem key={EvoucherStatus.INACTIVE}>Inactive</SelectItem>
              </Select>
              <Input
                label="Expiration"
                type="datetime-local"
                value={expiration.slice(0, 16)}
                onChange={(e) =>
                  setExpiration(new Date(e.target.value).toISOString())
                }
                isRequired
                isInvalid={!!errors.expiration}
                errorMessage={errors.expiration}
              />
            </div>
            <div className="flex-col items-center">
              <ImageInput onChange={handleFileChange} onCancel={() => handleFileChange(null)} image={imagePreview} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === 'add' ? 'Add E-voucher' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

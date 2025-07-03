'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';

import { Sponsors } from '@/types/sponsors';
import { SponsorType } from '@/types/sponsors';
import ImageInput from '@/components/ui/imageInput';
import { ImageIcon, Palette } from 'lucide-react';
import ColorInput from '@/components/ui/colorInput';

interface SponsorModalProps {
  type: string;
  sponsorTypes: SponsorType[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sponsor: FormData, mode: 'add' | 'edit') => void;
  allSponsors: Sponsors[];
  sponsor?: Sponsors;
  mode: 'add' | 'edit';
}

export function SponsorModal({
  type,
  sponsorTypes,
  isOpen,
  onClose,
  onSuccess,
  allSponsors,
  sponsor,
  mode,
}: SponsorModalProps) {
  const [name, setName] = useState({ en: '', th: '' });
  const [logo, setLogo] = useState<{ file: File | null; preview: string }>({
    file: null,
    preview: '',
  });
  const [previewColor, setPreviewColor] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState<number>(0);
  const [disabledKeys, setDisableKeys] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    nameEn: false,
    nameTh: false,
    logo: false,
    priority: false,
  });

  const handleCancel = () => {
    setName({ en: '', th: '' });
    setLogo({ file: null, preview: '' });
    setPreviewColor({});
    setPriority(0);
  };

  const handleColorChange = useCallback((key: string, value: string) => {
    setPreviewColor((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleFileChange = (file: File | null) => {
    setLogo((prev) => ({ ...prev, file: file }));
    if (!file) {
      setLogo((prev) => ({ ...prev, preview: '' }));
      return;
    }
    setErrors((prev) => ({ ...prev, logo: false }));

    const reader = new FileReader();
    reader.onload = () =>
      setLogo((prev) => ({ ...prev, preview: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setErrors({
      nameEn: !name.en.trim(),
      nameTh: !name.th.trim(),
      logo: !logo,
      priority: !priority,
    });
    if (!name.en.trim() || !name.th.trim() || !logo || !priority) return;

    const typeId = sponsorTypes.find((s) => s.name === type)?._id;
    if (!typeId) return;

    const formData = new FormData();
    formData.append('name[en]', name.en.trim());
    formData.append('name[th]', name.th.trim());
    formData.append('type', typeId);
    formData.append('priority', priority.toString());
    if (logo.file) formData.append('logo[logoPhoto]', logo.file);
    if (previewColor.primary)
      formData.append('color[primary]', previewColor.primary);
    if (previewColor.secondary)
      formData.append('color[secondary]', previewColor.secondary);

    onSuccess(formData || {}, mode);
    onClose();
  };

  useEffect(() => {
    if (sponsor && mode === 'edit') {
      setName({ en: sponsor.name.en, th: sponsor.name.th });
      setLogo({
        file: null,
        preview: `${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.logo.logoPhoto}`,
      });
      setPreviewColor((prev) => ({
        ...prev,
        ...(sponsor.color?.primary && { primary: sponsor.color.primary }),
        ...(sponsor.color?.secondary && { secondary: sponsor.color.secondary }),
      }));
      setPriority(sponsor.priority);
    } else {
      handleCancel();
    }
    setErrors({ nameEn: false, nameTh: false, logo: false, priority: false });
  }, [sponsor, mode, isOpen]);

  useEffect(() => {
    if (allSponsors) {
      const key = allSponsors
        .filter((sponsors) => sponsors.priority !== undefined)
        .map((sponsors) => sponsors.priority.toString());
      setDisableKeys(key);
    }
  }, [allSponsors]);

  return (
    <Modal
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      scrollBehavior="inside"
      isOpen={isOpen}
      size="2xl"
      onClose={() => {
        onClose();
        handleCancel();
      }}
    >
      <ModalContent className="max-w-[500px] mx-auto">
        <ModalHeader>
          {mode === 'add' ? 'Add New Sponsor' : 'Edit Sponsor'}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <Input
                isRequired
                errorMessage="Please fill out this field."
                isInvalid={errors.nameEn}
                label="Sponsor Name (English)"
                placeholder="Enter sponsor name in English"
                value={name.en}
                onValueChange={(val) => {
                  setName((prev) => ({ ...prev, en: val }));
                  setErrors((prev) => ({ ...prev, nameEn: false }));
                }}
              />
              <Input
                isRequired
                errorMessage="Please fill out this field."
                isInvalid={errors.nameTh}
                label="Sponsor Name (Thai)"
                placeholder="Enter sponsor name in Thai"
                value={name.th}
                onValueChange={(val) => {
                  setName((prev) => ({ ...prev, th: val }));
                  setErrors((prev) => ({ ...prev, nameTh: false }));
                }}
              />
              <Select
                isRequired
                errorMessage="Please select an item in the list."
                isInvalid={errors.priority}
                label="Priority"
                placeholder="Select priority"
                selectedKeys={priority ? [priority.toString()] : []}
                onChange={(e) => setPriority(Number(e.target.value))}
                disabledKeys={disabledKeys.filter(
                  (key) => key !== priority.toString(),
                )}
              >
                {Array.from({ length: 20 }).map((_, index) => {
                  const key = (index + 1).toString();
                  return <SelectItem key={key}>{key}</SelectItem>;
                })}
              </Select>
            </div>
            <div className="w-full">
              <ImageInput
                title={
                  <span className="flex gap-2">
                    <ImageIcon />
                    <span className="font-normal">Logo</span>
                  </span>
                }
                onChange={handleFileChange}
                onCancel={() => handleFileChange(null)}
                aspectRatio="aspect-square"
                image={sponsor?.logo.logoPhoto}
              />
              {errors.logo && (
                <p className="mt-2 text-center text-danger text-sm">
                  Please upload a logo image.
                </p>
              )}
            </div>
            <Accordion variant="shadow">
              <AccordionItem
                aria-label="Colors"
                title={
                  <div className="flex gap-2">
                    <span>Colors</span>
                    <span className="text-primary">(Optional)</span>
                  </div>
                }
                subtitle="Select colors for sponsor"
                startContent={<Palette />}
              >
                <ColorInput
                  colors={previewColor}
                  handleColorChange={handleColorChange}
                />
              </AccordionItem>
            </Accordion>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={() => {
              onClose();
              handleCancel();
            }}
          >
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

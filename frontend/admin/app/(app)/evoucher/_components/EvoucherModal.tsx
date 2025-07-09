"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea,
  Tooltip
} from "@heroui/react";
import { Upload } from "lucide-react";

import { Sponsors } from "@/types/sponsors";
import { Evoucher, EvoucherStatus, EvoucherType } from "@/types/evoucher";

type AddEvoucherProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  evoucherType: EvoucherType;
  sponsors: Sponsors[];
  evoucher?: Evoucher;
}

export function EvoucherModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  evoucherType,
  sponsors,
  evoucher
}: AddEvoucherProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [acronym, setAcronym] = useState("");
  const [detailTh, setDetailTh] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiration, setExpiration] = useState(new Date().toISOString());
  const [maxClaim, setMaxClaim] = useState<number>(0);
  const [status, setStatus] = useState<EvoucherStatus>(EvoucherStatus.ACTIVE);
  const [field, setField] = useState<{ cover: File | string | null }>({ cover: null });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) {
      setSelectedSponsor("");
      setAcronym("");
      setDetailTh("");
      setDetailEn("");
      setDiscount("");
      setExpiration(new Date().toISOString());
      setMaxClaim(0);
      setStatus(EvoucherStatus.ACTIVE);
      setField({ cover: null });
      setPreviewImage(null);
      setErrors({});

      return;
    }

    if (isOpen && mode === "edit" && evoucher) {
      setSelectedSponsor(evoucher.sponsors?.name?.en || "");
      setAcronym(evoucher.acronym || "");
      setDetailTh(evoucher.detail?.th || "");
      setDetailEn(evoucher.detail?.en || "");
      setDiscount(evoucher.discount || "");
      setExpiration(evoucher.expiration || new Date().toISOString());
      setMaxClaim(evoucher.claims?.maxClaim || 0);
      setStatus(evoucher.status || EvoucherStatus.ACTIVE);
      if (evoucher.photo?.coverPhoto) {
        setField({ cover: evoucher.photo.coverPhoto });
        setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.coverPhoto}`);
      } else {
        setField({ cover: null });
        setPreviewImage(null);
      }
      setErrors({});
    }
  }, [isOpen, mode, evoucher]);

  const validationRules: { key: string; value: string; message: string; validate?: (val: string) => boolean }[] = [
    { key: "sponsor", value: selectedSponsor, message: "Sponsor is required" },
    { key: "acronym", value: acronym, message: "Acronym is required" },
    { key: "discount", value: discount, message: "Discount is required", validate: (val) => !isNaN(Number(val)) && Number(val) >= 0 },
    { key: "maxClaim", value: String(maxClaim), message: "Max claim is required", validate: (val) => !isNaN(Number(val)) },
    { key: "detailTh", value: detailTh, message: "Detail (Thai) is required" },
    { key: "detailEn", value: detailEn, message: "Detail (English) is required" },
    { key: "expiration", value: expiration, message: "Expiration is required" },
    { key: "status", value: status, message: "Status is required" },
  ];

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    validationRules.forEach(({ key, value, message, validate }) => {
      if (!value || (validate && !validate(value))) {
        newErrors[key] = message;
      }
    });

    if (mode === "add" && !(field.cover instanceof File)) {
      newErrors.cover = "Cover image is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }
    setErrors({});

    const sponsorId = sponsors.find((s) => s.name.en === selectedSponsor)?._id;
    const formData = new FormData();

    formData.append("acronym", acronym);
    formData.append("discount", discount);
    formData.append("expiration", expiration);
    formData.append("detail[th]", detailTh);
    formData.append("detail[en]", detailEn);
    formData.append("maxClaims", String(maxClaim));
    formData.append("type", evoucherType);
    formData.append("status", status);
    if (sponsorId) formData.append("sponsors", sponsorId);
    if (field.cover instanceof File || mode === "add") {
      if (field.cover instanceof File) {
        formData.append("photo[coverPhoto]", field.cover);
      }
    }
    onSuccess(formData, mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={() => { onClose(); }}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? `Add ${evoucherType} E-voucher` : "Edit E-voucher"}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              isRequired
              errorMessage={errors.sponsor}
              isInvalid={!!errors.sponsor}
              label="Sponsor"
              selectedKeys={selectedSponsor ? [selectedSponsor] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;

                setSelectedSponsor(selectedKey);
              }}
            >
              {sponsors.map((s) => (
                <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
              ))}
            </Select>
            <Input isRequired errorMessage={errors.acronym} isInvalid={!!errors.acronym} label="Acronym"
              value={acronym}
              onChange={(e) => setAcronym(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input isRequired errorMessage={errors.discount} isInvalid={!!errors.discount} label="Discount" type="text"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)} />
            <Input isRequired errorMessage={errors.maxClaim} isInvalid={!!errors.maxClaim} label="Max Claims"
              type="number"
              value={String(maxClaim)}
              onChange={(e) => setMaxClaim(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Textarea isRequired errorMessage={errors.detailTh} isInvalid={!!errors.detailTh} label="Detail (Thai)" maxRows={3} minRows={2}
              value={detailTh}
              onChange={(e) => setDetailTh(e.target.value)} />
            <Textarea isRequired errorMessage={errors.detailEn} isInvalid={!!errors.detailEn} label="Detail (English)" maxRows={3} minRows={2}
              value={detailEn}
              onChange={(e) => setDetailEn(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 flex justify-center gap-5">
              <Select
                isRequired
                errorMessage={errors.status}
                isInvalid={!!errors.status}
                label="Status"
                selectedKeys={[status]}
                onChange={(e) => setStatus(e.target.value as EvoucherStatus)}
              >
                <SelectItem key={EvoucherStatus.ACTIVE}>Active</SelectItem>
                <SelectItem key={EvoucherStatus.INACTIVE}>Inactive</SelectItem>
              </Select>
              <Input isRequired errorMessage={errors.expiration} isInvalid={!!errors.expiration} label="Expiration"
                type="datetime-local"
                value={expiration.slice(0, 16)}
                onChange={(e) => setExpiration(new Date(e.target.value).toISOString())} />
            </div>
            <div className="flex-col items-center">
              <Tooltip content="Click to upload image" placement="top">
                <div
                  className={`relative w-full max-w-md h-48 rounded-xl transition-all duration-200 hover:border-primary/50 cursor-pointer group ${errors.cover ? "border border-red-500" : "bg-default-50"
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <img alt="Preview" className="w-full h-full object-cover rounded-xl" src={previewImage} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                      <span className="text-xs">No image uploaded</span>
                    </div>
                  )}
                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/30 text-white text-sm font-medium rounded-xl flex-col">
                    <Upload />
                  </div>
                </div>
              </Tooltip>
              {errors.cover && (
                <p className="text-sm text-red-500 text-center mt-2">{errors.cover}</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setField({ cover: file });
                  setPreviewImage(URL.createObjectURL(file));
                }
              }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => { onClose(); }}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add E-voucher" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

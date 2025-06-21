"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea,
  Tooltip
} from "@heroui/react";
import { Sponsors } from "@/types/sponsors";
import { Evoucher, EvoucherStatus, EvoucherType } from "@/types/evoucher";
import { Upload } from "lucide-react";

interface AddEvoucherProps {
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
  const [maxClaim, setMaxClaim] = useState<string>("");
  const [status, setStatus] = useState<EvoucherStatus>(EvoucherStatus.ACTIVE);
  const [field, setField] = useState<{ cover: File | string | null }>({ cover: null });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSponsor("");
      setAcronym("");
      setDetailTh("");
      setDetailEn("");
      setDiscount("");
      setExpiration(new Date().toISOString());
      setMaxClaim("");
      setStatus(EvoucherStatus.ACTIVE);
      setField({ cover: null });
      setPreviewImage(null);
      return;
    }

    if (isOpen && mode === "edit" && evoucher) {
      setSelectedSponsor(evoucher.sponsors?.name?.en || "");
      setAcronym(evoucher.acronym || "");
      setDetailTh(evoucher.detail?.th || "");
      setDetailEn(evoucher.detail?.en || "");
      setDiscount(evoucher.discount || "");
      setExpiration(evoucher.expiration || new Date().toISOString());
      setMaxClaim(evoucher.claims?.maxClaim?.toString() || "");
      setStatus(evoucher.status || EvoucherStatus.ACTIVE);
      if (evoucher.photo?.coverPhoto) {
        setField({ cover: evoucher.photo.coverPhoto });
        setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.coverPhoto}`);
      } else {
        setField({ cover: null });
        setPreviewImage(null);
      }
    }
  }, [isOpen, mode, evoucher]);

  const handleSubmit = () => {
    if (!selectedSponsor) return;

    const sponsorId = sponsors.find((s) => s.name.en === selectedSponsor)?._id;

    const formData = new FormData();
    formData.append("acronym", acronym);
    formData.append("discount", discount);
    formData.append("expiration", expiration);
    formData.append("detail[th]", detailTh);
    formData.append("detail[en]", detailEn);
    if (maxClaim) {
      formData.append("maxClaims", maxClaim);
    }
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
    <Modal isOpen={isOpen} onClose={() => { onClose(); }} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? `Add ${evoucherType} E-voucher` : "Edit E-voucher"}
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
            >
              {sponsors.map((s) => (
                <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
              ))}
            </Select>
            <Input label="Acronym" isRequired value={acronym} onChange={(e) => setAcronym(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Discount" type="text" value={discount} onChange={(e) => setDiscount(e.target.value)} isRequired />
            <Input label="Max Claims" type="number" value={maxClaim} onChange={(e) => setMaxClaim(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Textarea label="Detail (Thai)" value={detailTh} onChange={(e) => setDetailTh(e.target.value)} isRequired minRows={2} maxRows={3} />
            <Textarea label="Detail (English)" value={detailEn} onChange={(e) => setDetailEn(e.target.value)} isRequired minRows={2} maxRows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">


            <div className="sm:col-span-2 flex justify-center gap-5">
              <Select
                label="Status"
                selectedKeys={[status]}
                onChange={(e) => setStatus(e.target.value as EvoucherStatus)}
              >
                <SelectItem key={EvoucherStatus.ACTIVE}>Active</SelectItem>
                <SelectItem key={EvoucherStatus.INACTIVE}>Inactive</SelectItem>
              </Select>
              <Input label="Expiration" type="datetime-local" value={expiration.slice(0, 16)} onChange={(e) => setExpiration(new Date(e.target.value).toISOString())} isRequired />
            </div>
            <Tooltip placement="bottom" content="Click to upload image">
              <div
                className="relative w-full max-w-md h-48 rounded-xl bg-default-50 transition-all duration-200 hover:border-primary/50 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
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

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
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

"use client";

import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider, Input, Select, SelectItem, Textarea
} from "@heroui/react";
import { Sponsors } from "@/types/sponsors";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import PreviewModal from "./PreviewModal";

interface AddEvoucherProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  type: EvoucherType[];
  sponsors: Sponsors[];
  evoucher?: Evoucher;
}

export function EvoucherModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  type,
  sponsors,
  evoucher
}: AddEvoucherProps) {
  const [sponsor, setSponsor] = useState<Set<string>>(new Set());
  const [acronym, setAcronym] = useState("");
  const [detailTh, setDetailTh] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [discount, setDiscount] = useState("0");
  const [expiration, setExpiration] = useState(new Date().toISOString());
  const [selectedType, setSelectedType] = useState<Set<string>>(new Set());
  const [maxClaim, setMaxClaim] = useState("0");
  const [field, setField] = useState<{ cover: File | string | null }>({ cover: null });
  const [previewImage, setPreviewImage] = useState("");

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setField({ cover: file });
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!sponsor.size || !selectedType.size) return;

    const sponsorId = sponsors.find((s) => s.name.en === Array.from(sponsor)[0])?._id;

    const formData = new FormData();
    formData.append("acronym", acronym);
    formData.append("discount", discount);
    formData.append("expiration", expiration);
    formData.append("detail[th]", detailTh);
    formData.append("detail[en]", detailEn);
    formData.append("maxClaim", maxClaim);
    if (sponsorId) formData.append("sponsors", sponsorId);
    if (field.cover) formData.append("photo[coverPhoto]", field.cover);
    formData.append("type", Array.from(selectedType)[0]);

    onSuccess(formData, mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); }} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add E-voucher" : "Edit E-voucher"}
        </ModalHeader>

        <Divider />

        <ModalBody className="flex flex-col gap-6">

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select label="Sponsor" isRequired selectedKeys={sponsor} onSelectionChange={(keys) => setSponsor(keys as Set<string>)}>
              {sponsors.map((s) => (
                <SelectItem key={s.name.en}>{s.name.en}</SelectItem>
              ))}
            </Select>

            <Select label="Type" isRequired selectedKeys={selectedType} onSelectionChange={(keys) => setSelectedType(keys as Set<string>)}>
              {type.map((t) => (
                <SelectItem key={t}>{t}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Section 2: Acronym */}
          <Input label="Acronym" isRequired value={acronym} onChange={(e) => setAcronym(e.target.value)} />

          <Divider />

          {/* Section 3: Discount + Expiration + MaxClaim */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input label="Discount (%)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} isRequired />
            <Input label="Max Claims" type="number" value={maxClaim} onChange={(e) => setMaxClaim(e.target.value)} isRequired />
            <Input label="Expiration" type="datetime-local" value={expiration.slice(0, 16)} onChange={(e) => setExpiration(new Date(e.target.value).toISOString())} isRequired />
          </div>

          <Divider />

          {/* Section 4: Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Textarea label="Detail (Thai)" value={detailTh} onChange={(e) => setDetailTh(e.target.value)} isRequired />
            <Textarea label="Detail (English)" value={detailEn} onChange={(e) => setDetailEn(e.target.value)} isRequired />
          </div>

          <Divider />

          {/* Section 5: Cover Upload */}
          <div>
            <h3 className="text-sm font-medium mb-3">Cover Photo</h3>
            <PreviewModal
              field={field}
              setField={setField}
              previewImage={previewImage}
              setPreviewImage={setPreviewImage}
              handleFileChange={handleFileChange}
              title={mode as "Add" | "Edit"}
            />
          </div>

        </ModalBody>

        <Divider />

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

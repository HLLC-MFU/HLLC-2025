"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem
} from "@heroui/react";
import { Sponsors } from "@/types/sponsors";
import { EvoucherCode, EvoucherCodeStatus } from "@/types/evoucher-code";
import { useEvoucher } from "@/hooks/useEvoucher";

interface AddEvoucherCodeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  sponsors: Sponsors[];
  sponsorId: string;
  evoucherCode?: EvoucherCode;
}

export function EvoucherCodeModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  sponsors,
  sponsorId,
  evoucherCode
}: AddEvoucherCodeProps) {
  const { evouchers } = useEvoucher();
  const [selectedEvoucher, setSelectedEvoucher] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<EvoucherCodeStatus>(EvoucherCodeStatus.ACTIVE);

  // Load existing data if in edit mode
  useEffect(() => {
    if (mode === "edit" && evoucherCode) {
      setSelectedEvoucher(evoucherCode.evoucher._id);
      setCode(evoucherCode.code);
      setStatus(evoucherCode.status);
    }
  }, [mode, evoucherCode]);

  const handleSubmit = () => {
    if (!selectedEvoucher) return;

    const formData = new FormData();
    formData.append("code", code);
    formData.append("evoucher", selectedEvoucher);
    formData.append("sponsors", sponsorId);
    formData.append("status", status);

    onSuccess(formData, mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); }} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add Evoucher Code" : "Edit Evoucher Code"}
        </ModalHeader>

        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select 
              label="Evoucher" 
              isRequired 
              selectedKeys={selectedEvoucher ? [selectedEvoucher] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSelectedEvoucher(selectedKey);
              }}
            >
              {evouchers
                .filter(e => e.sponsors._id === sponsorId)
                .map((e) => (
                  <SelectItem key={e._id}>{e.acronym}</SelectItem>
                ))
              }
            </Select>
            <Input 
              label="Code" 
              isRequired 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="Status"
              selectedKeys={[status]}
              onChange={(e) => setStatus(e.target.value as EvoucherCodeStatus)}
            >
              <SelectItem key={EvoucherCodeStatus.ACTIVE}>Active</SelectItem>
              <SelectItem key={EvoucherCodeStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem key={EvoucherCodeStatus.USED}>Used</SelectItem>
            </Select>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => { onClose(); }}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add Code" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

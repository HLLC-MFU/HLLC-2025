"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem
} from "@heroui/react";
import { Sponsors } from "@/types/sponsors";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";

interface AddEvoucherCodeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  sponsors: Sponsors[];
  evouchers: Evoucher[];
  evoucherCode?: EvoucherCode;
}

export function EvoucherCodeModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  sponsors,
  evouchers,
  evoucherCode
}: AddEvoucherCodeProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<string>("");
  const [selectedEvoucher, setSelectedEvoucher] = useState<string>("");
  const [code, setCode] = useState("");
  const [expiration, setExpiration] = useState(new Date().toISOString());

  // Load existing data if in edit mode
  useEffect(() => {
    if (mode === "edit" && evoucherCode) {
      setSelectedSponsor(evoucherCode.evoucher?.sponsors?.name.en || "");
      setSelectedEvoucher(evoucherCode.evoucher?._id || "" as string);
      setCode(evoucherCode.code);
      setExpiration(evoucherCode.metadata.expiration);
    }
  }, [mode, evoucherCode]);

  const handleSubmit = () => {
    if (!selectedSponsor || !selectedEvoucher) return;

    const formData = new FormData();
    formData.append("code", code);
    formData.append("evoucher", selectedEvoucher);
    formData.append("metadata[expiration]", expiration);

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
                .filter(e => e.sponsors?.name?.en === selectedSponsor)
                .map((e: Evoucher) => (
                  <SelectItem key={e._id}>{e.acronym || "" as string}</SelectItem>
                ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="Code" 
              isRequired 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
            />
            <Input 
              label="Expiration" 
              type="datetime-local" 
              value={expiration.slice(0, 16)} 
              onChange={(e) => setExpiration(new Date(e.target.value).toISOString())} 
              isRequired 
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => { onClose(); }}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add Evoucher Code" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

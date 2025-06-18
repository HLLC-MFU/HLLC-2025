"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem
} from "@heroui/react";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import { useUsers } from "@/hooks/useUsers";
import { ScopeSelector } from "@/app/(app)/evoucher-code/_components/ScopeSelector";
import { Users } from "lucide-react";

interface AddEvoucherCodeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  mode: "add" | "edit";
  evouchers: Evoucher[];
  evoucherCode?: EvoucherCode;
  sponsorId?: string;
}

export function EvoucherCodeModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  evouchers,
  evoucherCode,
  sponsorId
}: AddEvoucherCodeProps) {
  const { users, loading: usersLoading } = useUsers();
  const [selectedEvoucher, setSelectedEvoucher] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expiration, setExpiration] = useState(new Date().toISOString());

  // Filter evouchers by sponsor
  const filteredEvouchers = evouchers.filter(e => e.sponsors._id === sponsorId);

  // Load existing data if in edit mode
  useEffect(() => {
    if (mode === "edit" && evoucherCode) {
      setSelectedEvoucher(evoucherCode.evoucher?._id || "");
      setSelectedUsers(evoucherCode.user?._id ? [evoucherCode.user._id] : []);
      setExpiration(evoucherCode.metadata.expiration);
    }
  }, [mode, evoucherCode]);

  const handleSubmit = () => {
    if (!selectedEvoucher || selectedUsers.length === 0) return;

    // Create a FormData object for each selected user
    const promises = selectedUsers.map(userId => {
      const formData = new FormData();
      formData.append("evoucher", selectedEvoucher);
      formData.append("user", userId);
      formData.append("metadata[expiration]", expiration);
      return onSuccess(formData, mode);
    });

    // Close modal after all requests are done
    Promise.all(promises).then(() => {
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); }} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add Evoucher Code" : "Edit Evoucher Code"}
        </ModalHeader>

        <ModalBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6">
            <Select 
              label="Evoucher" 
              isRequired 
              selectedKeys={selectedEvoucher ? [selectedEvoucher] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSelectedEvoucher(selectedKey);
              }}
            >
              {filteredEvouchers.map((e) => (
                <SelectItem key={e._id} textValue={e.acronym}>
                  <div className="flex flex-col">
                    <span>{e.acronym}</span>
                    <span className="text-small text-default-400">Discount: {e.discount}%</span>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <ScopeSelector
              label="Select Users"
              icon={Users}
              items={users}
              selectedItems={selectedUsers}
              onSelect={(id) => setSelectedUsers([...selectedUsers, id])}
              onRemove={(id) => setSelectedUsers(selectedUsers.filter(u => u !== id))}
              isLoading={usersLoading}
              placeholder="Select users..."
              getName={(user) => user.username}
              getId={(user) => user._id}
              searchFields={(user) => [
                user.username,
                user.metadata?.[0]?.major?.name?.en,
                user.metadata?.[0]?.major?.school?.name?.en
              ]}
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

// Helper function to convert ISO string to local datetime input value
const toLocalInputValue = (iso: string) => new Date(iso).toISOString().slice(0, 16);

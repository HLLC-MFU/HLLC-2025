"use client";

import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, addToast
} from "@heroui/react";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import { ScopeSelector } from "@/app/(app)/evoucher-code/_components/ScopeSelector";
import { Users } from "lucide-react";
import { EvoucherSelect } from "./EvoucherSelect";
import { useEvoucherCodeForm } from "./useEvoucherCodeForm";
interface AddEvoucherCodeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => Promise<void>;
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
  evoucherCode,
  sponsorId,
  evouchers
}: AddEvoucherCodeProps) {
  const {
    usersLoading,
    selectedEvoucher,
    selectedUsers,
    expiration,
    setSelectedEvoucher,
    setSelectedUsers,
    availableUsers,
    searchQuery,
    setSearchQuery,
    setFilters
  } = useEvoucherCodeForm(isOpen, mode, evoucherCode, sponsorId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEvoucher || selectedUsers.length === 0) return;

    setIsSubmitting(true);
    try {
      const promises = selectedUsers.map(userId => {
        const formData = new FormData();
        formData.append("evoucher", selectedEvoucher);
        formData.append("user", userId);
        formData.append("metadata[expiration]", expiration);
        return onSuccess(formData, mode);
      });

      await Promise.all(promises);

      addToast({
        title: "Success",
        description: `Successfully ${mode === "add" ? "created" : "updated"} evoucher code(s).`,
        color: "success"
      });

      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Failed to process evoucher code.",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{mode === "add" ? "Add Evoucher Code" : "Edit Evoucher Code"}</ModalHeader>

        <ModalBody className="flex flex-col gap-6">

          {/* evoucher */}
          <EvoucherSelect
            value={selectedEvoucher}
            onChange={(evoucherId) => {
              setSelectedEvoucher(evoucherId);
              setSelectedUsers([]);
            }}
            evouchers={evouchers.filter(e => e.sponsors._id === sponsorId)}
            isDisabled={mode === "edit" || isSubmitting}
          />

          <div className="flex flex-col gap-4">
            {/* user */}
            <ScopeSelector
              label="Select Users"
              icon={Users}
              items={availableUsers}
              selectedItems={selectedUsers}
              onSelect={(id) => {
                const stringId = id.toString();
                if (selectedUsers.includes(stringId)) return;

                const updated = mode === "edit" ? [stringId] : [...selectedUsers, stringId];
                setSelectedUsers(updated);
              }}
              onRemove={(id) => {
                const stringId = id.toString();
                if (mode === "edit" && selectedUsers.length <= 1) return;
                setSelectedUsers(selectedUsers.filter((u) => u !== stringId));
              }}
              isLoading={usersLoading}
              placeholder="Select users..."
              getName={(user) => user.username}
              getId={(user) => user._id.toString()}
              searchFields={(user) => [
                user.username,
                user.metadata?.[0]?.major?.name?.th,
                user.metadata?.[0]?.major?.name?.en,
                user.metadata?.[0]?.major?.school?.name?.th,
                user.metadata?.[0]?.major?.school?.name?.en,
              ]}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSubmit} isDisabled={!selectedEvoucher || selectedUsers.length === 0} isLoading={isSubmitting}>
            {mode === "add"
              ? `Add Evoucher Code${selectedUsers.length > 1 ? "s" : ""} (${selectedUsers.length})`
              : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

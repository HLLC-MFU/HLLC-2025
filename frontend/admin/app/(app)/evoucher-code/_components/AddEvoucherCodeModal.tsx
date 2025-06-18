"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Progress,
  addToast
} from "@heroui/react";
import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import { useUsers } from "@/hooks/useUsers";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { ScopeSelector } from "@/app/(app)/evoucher-code/_components/ScopeSelector";
import { Users, AlertCircle } from "lucide-react";

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
  evouchers,
  evoucherCode,
  sponsorId
}: AddEvoucherCodeProps) {
  const { users, loading: usersLoading } = useUsers();
  const { fetchEvoucherCode, evoucherCodes } = useEvoucherCode();
  const [selectedEvoucher, setSelectedEvoucher] = useState<string>(evoucherCode?.evoucher?._id || "");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(evoucherCode?.user?._id ? [evoucherCode.user._id] : []);
  const [expiration, setExpiration] = useState(evoucherCode?.metadata?.expiration || new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter evouchers by sponsor
  const filteredEvouchers = evouchers.filter(e => e.sponsors._id === sponsorId);

  // Check if evoucher is expired
  const isEvoucherExpired = (evoucher: Evoucher): boolean => {
    const expirationDate = new Date(evoucher.expiration);
    return expirationDate < new Date();
  };

  // Check if user already has an evoucher code for the selected evoucher
  const hasExistingEvoucherCode = (userId: string): boolean => {
    if (!selectedEvoucher) return false;
    
    // In edit mode, exclude the current evoucher code from the check
    const existingCode = evoucherCodes.find(code => 
      code.evoucher?._id === selectedEvoucher && 
      code.user?._id === userId &&
      (!evoucherCode || code._id !== evoucherCode._id)
    );
    
    return !!existingCode;
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && mode === "edit" && evoucherCode) {
      setSelectedEvoucher(evoucherCode.evoucher?._id || "");
      setSelectedUsers(evoucherCode.user?._id ? [evoucherCode.user._id] : []);
      setExpiration(evoucherCode.metadata?.expiration || new Date().toISOString());
    } else if (!isOpen) {
      setSelectedEvoucher("");
      setSelectedUsers([]);
      setExpiration(new Date().toISOString());
    }
  }, [isOpen, mode, evoucherCode]);

  const handleSubmit = async () => {
    if (!selectedEvoucher || selectedUsers.length === 0) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("evoucher", selectedEvoucher);
      formData.append("user", selectedUsers[0]); // For edit mode, we only use the first user
      formData.append("metadata[expiration]", expiration);

      await onSuccess(formData, mode);
      
      addToast({
        title: "Success",
        description: `Successfully ${mode === 'add' ? 'created' : 'updated'} evoucher code.`,
        color: "success"
      });

      onClose();
    } catch (error) {
      console.error('Error in operation:', error);
      addToast({
        title: "Error",
        description: "Failed to process evoucher code.",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvoucherChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedEvoucher(selectedKey);
    // Clear selected users when evoucher changes
    setSelectedUsers([]);
  };

  const handleUserSelect = (id: string) => {
    // Check if user already has an evoucher code for the selected evoucher
    if (hasExistingEvoucherCode(id)) {
      addToast({
        title: "Cannot Select User",
        description: "This user already has a code for the selected evoucher.",
        color: "danger"
      });
      return;
    }

    // In edit mode, replace the current user
    if (mode === "edit") {
      setSelectedUsers([id]);
      return;
    }
    // In add mode, add to the list
    setSelectedUsers([...selectedUsers, id]);
  };

  const handleUserRemove = (id: string) => {
    // In edit mode, don't allow removing the last user
    if (mode === "edit" && selectedUsers.length <= 1) {
      return;
    }
    setSelectedUsers(selectedUsers.filter(u => u !== id));
  };

  // Filter out users who already have an evoucher code for the selected evoucher
  const availableUsers = users.filter(user => !hasExistingEvoucherCode(user._id));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl" 
      scrollBehavior="inside"
      isDismissable={!isSubmitting}
      classNames={{
        base: "z-[1000]"
      }}
    >
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
              onSelectionChange={handleEvoucherChange}
              isDisabled={mode === "edit" || isSubmitting}
              classNames={{
                trigger: "z-0"
              }}
            >
              {filteredEvouchers.map((e) => {
                const expired = isEvoucherExpired(e);
                return (
                  <SelectItem 
                    key={e._id} 
                    textValue={e.acronym}
                    isDisabled={expired}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={expired ? "text-danger" : ""}>{e.acronym}</span>
                        {expired && (
                          <span className="text-tiny text-danger flex items-center gap-1">
                            <AlertCircle size={12} />
                            Expired
                          </span>
                        )}
                      </div>
                      <span className="text-small text-default-400">
                        Discount: {e.discount}% • Expires: {new Date(e.expiration).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </Select>

            <ScopeSelector
              label="Select Users"
              icon={Users}
              items={availableUsers}
              selectedItems={selectedUsers}
              onSelect={handleUserSelect}
              onRemove={handleUserRemove}
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
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isDisabled={!selectedEvoucher || selectedUsers.length === 0}
          >
            {mode === "add" ? "Add Evoucher Code" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
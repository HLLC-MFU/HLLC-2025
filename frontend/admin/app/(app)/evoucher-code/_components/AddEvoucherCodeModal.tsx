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
  const { fetchEvoucherCode } = useEvoucherCode();
  const [selectedEvoucher, setSelectedEvoucher] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expiration, setExpiration] = useState(new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filter evouchers by sponsor
  const filteredEvouchers = evouchers.filter(e => e.sponsors._id === sponsorId);

  // Check if evoucher is expired
  const isEvoucherExpired = (evoucher: Evoucher): boolean => {
    const expirationDate = new Date(evoucher.expiration);
    return expirationDate < new Date();
  };

  // Load existing data if in edit mode
  useEffect(() => {
    const loadEvoucherCode = async () => {
      if (mode === "edit" && evoucherCode?._id) {
        setIsLoading(true);
        try {
          const currentData = await fetchEvoucherCode(evoucherCode._id);
          if (currentData) {
            setSelectedEvoucher(currentData.evoucher?._id || "");
            setSelectedUsers(currentData.user?._id ? [currentData.user._id] : []);
            setExpiration(currentData.metadata.expiration || new Date().toISOString());
          }
        } catch (error) {
          console.error('Error loading evoucher code:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadEvoucherCode();
  }, [mode, evoucherCode, fetchEvoucherCode]);

  const handleSubmit = async () => {
    if (!selectedEvoucher || selectedUsers.length === 0) return;

    setIsSubmitting(true);
    setProgress(0);

    try {
      const total = selectedUsers.length;
      const results = [];
      let successCount = 0;
      let hasError = false;

      // Process each user sequentially
      for (let i = 0; i < selectedUsers.length; i++) {
        const userId = selectedUsers[i];
        
        try {
          const formData = new FormData();
          formData.append("evoucher", selectedEvoucher);
          formData.append("user", userId);
          formData.append("metadata[expiration]", expiration);
          
          // Wait for each request to complete before moving to the next
          const result = await onSuccess(formData, mode);
          results.push({ userId, success: true });
          successCount++;
        } catch (error: any) {
          console.error(`Error creating evoucher code for user ${userId}:`, error);
          results.push({ 
            userId, 
            success: false, 
            error: error.message || 'Failed to create evoucher code' 
          });
          hasError = true;
        }

        // Update progress
        setProgress(((i + 1) / total) * 100);
      }

      // Show summary toast
      if (hasError) {
        const successMessage = successCount > 0 
          ? `Successfully created ${successCount} out of ${total} evoucher codes. `
          : '';
        const errorMessage = `Some evoucher codes could not be created. Please check the console for details.`;
        addToast({
          title: "Partial Success",
          description: successMessage + errorMessage,
          color: "warning"
        });
      } else {
        addToast({
          title: "Success",
          description: `Successfully created ${total} evoucher code${total !== 1 ? 's' : ''}.`,
          color: "success"
        });
      }

      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Error in batch operation:', error);
      addToast({
        title: "Error",
        description: "Failed to process evoucher codes.",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <div className="p-6 flex items-center justify-center">
            <Progress
              size="sm"
              isIndeterminate
              aria-label="Loading..."
              className="max-w-md"
            />
          </div>
        </ModalContent>
      </Modal>
    );
  }

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
              isDisabled={mode === "edit"}
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
              isDisabled={mode === "edit"}
            />

            {isSubmitting && (
              <div className="w-full">
                <Progress
                  aria-label="Creating evoucher codes..."
                  value={progress}
                  className="max-w-md"
                />
                <p className="text-small text-default-400 mt-2">
                  Creating evoucher codes... {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => { onClose(); }}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting || !selectedEvoucher || selectedUsers.length === 0}
          >
            {mode === "add" ? "Add Evoucher Code" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Helper function to convert ISO string to local datetime input value
const toLocalInputValue = (iso: string) => new Date(iso).toISOString().slice(0, 16);

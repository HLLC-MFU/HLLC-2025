"use client";

import React, { useEffect, useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, addToast,
} from "@heroui/react";
import { Users } from "lucide-react";

import { EvoucherSelect } from "./EvoucherSelect";

import { EvoucherCode } from "@/types/evoucher-code";
import { Evoucher } from "@/types/evoucher";
import { ScopeSelector } from "@/app/(app)/evoucher-code/_components/ScopeSelector";
import { useUsers } from "@/hooks/useUsers";

function useDebounce<T>(value: T, delay: number = 10000): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type AddEvoucherCodeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evoucherCode: Partial<EvoucherCode>, mode: "add" | "edit") => void;
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
  evouchers,
  sponsorId,
}: AddEvoucherCodeProps) {
  const { fetchByUsername } = useUsers();

  const [selectedEvoucher, setSelectedEvoucher] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (mode === "edit" && evoucherCode) {
      setSelectedEvoucher(
        typeof evoucherCode.evoucher === "string"
          ? evoucherCode.evoucher
          : evoucherCode.evoucher?._id || ""
      );
      setSelectedUsers([
        typeof evoucherCode.user === "string"
          ? evoucherCode.user
          : evoucherCode.user?._id || "",
      ]);
    } else {
      setSelectedEvoucher("");
      setSelectedUsers([]);
    }
  }, [isOpen, mode, evoucherCode]);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!selectedEvoucher || !debouncedSearch.trim()) {
        setAvailableUsers([]);

        return;
      }

      setUsersLoading(true);
      try {
        const users = await fetchByUsername(debouncedSearch.trim());

        setAvailableUsers(users ?? []);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setAvailableUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchAvailableUsers();
  }, [selectedEvoucher, debouncedSearch]);

  const handleSubmit = async () => {
    if (!selectedEvoucher || selectedUsers.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const userId of selectedUsers) {
        const evoucherCode: Partial<EvoucherCode> = {
          evoucher: selectedEvoucher,
          user: userId,
        };

        await onSuccess(evoucherCode, mode);
      }

      addToast({
        title: "Success",
        description: `Successfully ${mode === "add" ? "created" : "updated"} evoucher code(s).`,
        color: "success",
      });

      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Failed to process evoucher code.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>{mode === "add" ? "Add Evoucher Code" : "Edit Evoucher Code"}</ModalHeader>
        <ModalBody className="flex flex-col gap-6">
          <EvoucherSelect
            evouchers={evouchers.filter((e) => e.sponsors._id === sponsorId)}
            isDisabled={mode === "edit" || isSubmitting}
            value={selectedEvoucher}
            onChange={(evoucherId) => {
              setSelectedEvoucher(evoucherId);
              setSelectedUsers([]);
            }}
          />

          <div className="flex flex-col gap-4">
            <ScopeSelector
              getId={(user) => user._id.toString()}
              getName={(user) => user.username}
              icon={Users}
              isLoading={usersLoading}
              items={availableUsers}
              label="Select Users"
              placeholder="Select users..."
              searchFields={(user) => [
                user.username,
                user.metadata?.[0]?.major?.name?.th,
                user.metadata?.[0]?.major?.name?.en,
                user.metadata?.[0]?.major?.school?.name?.th,
                user.metadata?.[0]?.major?.school?.name?.en,
              ]}
              searchQuery={searchQuery}
              selectedItems={selectedUsers}
              setSearchQuery={setSearchQuery}
              onRemove={(id) => {
                const stringId = id.toString();

                if (mode === "edit" && selectedUsers.length <= 1) return;
                setSelectedUsers(selectedUsers.filter((u) => u !== stringId));
              }}
              onSelect={(id) => {
                const stringId = id.toString();

                if (selectedUsers.includes(stringId)) return;

                const updated = mode === "edit" ? [stringId] : [...selectedUsers, stringId];

                setSelectedUsers(updated);
              }}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedEvoucher || selectedUsers.length === 0}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          >
            {mode === "add"
              ? `Add Evoucher Code${selectedUsers.length > 1 ? "s" : ""} (${selectedUsers.length})`
              : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

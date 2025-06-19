import { useState, useEffect } from "react";
import { EvoucherCode } from "@/types/evoucher-code";
import { useUsers } from "@/hooks/useUsers";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { User } from "@/types/user";

export const useEvoucherCodeForm = (
  isOpen: boolean,
  mode: "add" | "edit",
  evoucherCode?: EvoucherCode,
  sponsorId?: string
) => {
  const { fetchByUsername, loading: usersLoading } = useUsers();
  const { evoucherCodes } = useEvoucherCode();

  const [selectedEvoucher, setSelectedEvoucher] = useState<string>(evoucherCode?.evoucher?._id || "");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(evoucherCode?.user?._id ? [evoucherCode.user._id] : []);
  const [expiration, setExpiration] = useState(evoucherCode?.metadata?.expiration || new Date().toISOString());
  const [filters, setFilters] = useState<{ school?: string; major?: string }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen && mode === "edit" && evoucherCode) {
      setSelectedEvoucher(evoucherCode.evoucher?._id || "");
      setSelectedUsers(evoucherCode.user?._id ? [evoucherCode.user._id] : []);
      setExpiration(evoucherCode.metadata?.expiration || new Date().toISOString());
    } else if (!isOpen) {
      setSelectedEvoucher("");
      setSelectedUsers([]);
      setExpiration(new Date().toISOString());
      setFilters({});
      setSearchQuery("");
      setAvailableUsers([]);
    }
  }, [isOpen, mode, evoucherCode]);

  const hasExistingEvoucherCode = (userId: string): boolean => {
    if (!selectedEvoucher) return false;

    const existing = evoucherCodes.find(code =>
      code.evoucher?._id === selectedEvoucher &&
      code.user?._id === userId &&
      (!evoucherCode || code._id !== evoucherCode._id)
    );

    return !!existing;
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setAvailableUsers([]);
        return;
      }

      const results = await fetchByUsername(searchQuery);

      const filtered = results.filter(user => {
        if (filters.school && user.metadata?.[0]?.major?.school?._id !== filters.school) return false;
        if (filters.major && user.metadata?.[0]?.major?._id !== filters.major) return false;
        return true;
      });

      setAvailableUsers(filtered);
    }, 1000);

    return () => clearTimeout(delay);
  }, [searchQuery, selectedEvoucher, filters]);


  return {
    usersLoading,
    selectedEvoucher,
    selectedUsers,
    expiration,
    setSelectedEvoucher,
    setSelectedUsers,
    setExpiration,
    availableUsers,
    hasExistingEvoucherCode,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
  };
};

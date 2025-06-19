import { useState, useEffect, useMemo } from "react";
import { EvoucherCode } from "@/types/evoucher-code";
import { useUsers } from "@/hooks/useUsers";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";

// แยกมาเพราะไม่อยากให้มันเยอะใร Modal
export const useEvoucherCodeForm = (
  isOpen: boolean,
  mode: "add" | "edit",
  evoucherCode?: EvoucherCode,
  sponsorId?: string
) => {
  const { users, loading: usersLoading } = useUsers();
  const { evoucherCodes } = useEvoucherCode();

  const [selectedEvoucher, setSelectedEvoucher] = useState<string>(evoucherCode?.evoucher?._id || "");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(evoucherCode?.user?._id ? [evoucherCode.user._id] : []);
  const [expiration, setExpiration] = useState(evoucherCode?.metadata?.expiration || new Date().toISOString());
  const [filters, setFilters] = useState<{ school?: string; major?: string }>({});

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

  const availableUsers = useMemo(() => {
    let filteredUsers = users;

    // Apply school filter
    if (filters.school) {
      filteredUsers = filteredUsers.filter(user => 
        user.metadata?.[0]?.major?.school?._id === filters.school
      );
    }

    // Apply major filter
    if (filters.major) {
      filteredUsers = filteredUsers.filter(user => 
        user.metadata?.[0]?.major?._id === filters.major
      );
    }

    return filteredUsers.filter(user => !hasExistingEvoucherCode(user._id));
  }, [users, filters.school, filters.major, selectedEvoucher]);

  return {
    users,
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
    setFilters
  };
};

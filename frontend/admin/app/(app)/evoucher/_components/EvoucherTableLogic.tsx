import { useState, useMemo } from "react";
import { SortDescriptor, addToast } from "@heroui/react";
import type { Selection } from "@react-types/shared";
import { Evoucher } from "@/types/evoucher";
import { useEvoucher } from "@/hooks/useEvoucher";
import { apiRequest } from "@/utils/api";

// Utility functions
const filterItems = (items: Evoucher[], search: string) => {
    const query = search.toLowerCase();
    return items.filter(evoucher =>
        evoucher.sponsors.name.en.toLowerCase().includes(query) ||
        evoucher.discount.toString().includes(query) ||
        evoucher.acronym.toLowerCase().includes(query) ||
        evoucher.detail.en.toLowerCase().includes(query) ||
        evoucher.expiration.toString().includes(query)
    );
};

const sortItems = (items: Evoucher[], descriptor: SortDescriptor) => {
    return [...items].sort((a, b) => {
        const first = a[descriptor.column as keyof Evoucher] as number;
        const second = b[descriptor.column as keyof Evoucher] as number;
        const cmp = first < second ? -1 : first > second ? 1 : 0;
        return descriptor.direction === "descending" ? -cmp : cmp;
    });
};

const paginateItems = (items: Evoucher[], page: number, rowsPerPage: number) => {
    const start = (page - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
};

interface UseEvoucherTableProps {
    evouchers: Evoucher[];
    rowsPerPage?: number;
}

export function useEvoucherTable({ evouchers, rowsPerPage = 5 }: UseEvoucherTableProps) {
    const { createEvoucher, deleteEvoucher } = useEvoucher();

    // State
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set<string>());
    const [typeFilter, setTypeFilter] = useState<Selection>("all");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "acronym",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);
    const [actionText, setActionText] = useState<"Add" | "Edit">("Add");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

    // Computed values
    const filteredItems = useMemo(() => 
        filterValue ? filterItems(evouchers, filterValue) : evouchers, 
        [evouchers, filterValue]
    );

    const sortedItems = useMemo(() => 
        sortItems(filteredItems, sortDescriptor), 
        [filteredItems, sortDescriptor]
    );

    const pagedItems = useMemo(() => 
        paginateItems(sortedItems, page, rowsPerPage), 
        [sortedItems, page, rowsPerPage]
    );

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    // Handlers
    const handleAdd = async (evoucher: FormData) => {
        try {
            const response = await createEvoucher(evoucher);
            setIsModalOpen(false);

            addToast({
                title: "Add Successfully",
                description: "Data has been added successfully",
            });

            if (response) window.location.reload();
        } catch (error) {
            addToast({
                title: "Failed to Add",
                description: (error as Error)?.message || "An error occurred while adding data.",
                color: "danger",
            });
        }
    };

    const handleDelete = async () => {
        let response;
    
        if (Array.from(selectedKeys).length > 0) {
          response = await apiRequest(`/evoucher/${Array.from(selectedKeys) as string[]}`, "DELETE", {
            credentials: "include",
          });
        } else {
          response = await apiRequest(`/evoucher/${evouchers[0]._id}`, "DELETE", {
            credentials: "include",
          });
        }
        
        setIsDeleteOpen(false);
        
        if (response) {
            addToast({
                title: "Delete Successfully",
                description: "Data has deleted successfully",
            });
            window.location.reload();
        }
      };

    const handleSearch = (val: string) => {
        setFilterValue(val);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const handlePreviousPage = () => setPage(prev => Math.max(1, prev - 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const handleEdit = () => {
        setActionText("Edit");
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setActionText("Add");
        setIsModalOpen(true);
    };

    return {
        // State
        filterValue,
        selectedKeys,
        typeFilter,
        sortDescriptor,
        page,
        actionText,
        isModalOpen,
        isDeleteOpen,
        
        // Computed
        filteredItems,
        sortedItems,
        pagedItems,
        pages,
        
        // Setters
        setSelectedKeys,
        setTypeFilter,
        setSortDescriptor,
        setPage,
        setIsModalOpen,
        setIsDeleteOpen,
        
        // Handlers
        handleAdd,
        handleDelete,
        handleSearch,
        handleClear,
        handlePreviousPage,
        handleNextPage,
        handleEdit,
        handleAddNew,
    };
} 